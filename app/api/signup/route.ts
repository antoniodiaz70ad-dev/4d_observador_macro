export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ensureDatabaseSchema, isMissingTableError } from "@/lib/ensure-database-schema";

type SignupPayload = {
  email?: string;
  password?: string;
  fullName?: string;
};

async function createUser({ email, password, fullName }: Required<Pick<SignupPayload, 'email' | 'password'>> & Pick<SignupPayload, 'fullName'>) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return { error: "El usuario ya existe", status: 400 as const };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: fullName || "Observador 4D",
      role: "user"
    }
  });

  return { user };
}

export async function POST(req: NextRequest) {
  let payload: SignupPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const fullName = payload.fullName?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }

  try {
    const result = await createUser({ email, password, fullName });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { message: "Usuario creado exitosamente", userId: result.user.id },
      { status: 201 }
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      try {
        await ensureDatabaseSchema();
        const result = await createUser({ email, password, fullName });

        if ('error' in result) {
          return NextResponse.json(
            { error: result.error },
            { status: result.status }
          );
        }

        return NextResponse.json(
          { message: "Usuario creado exitosamente", userId: result.user.id },
          { status: 201 }
        );
      } catch (retryError) {
        console.error("Error en signup despues de inicializar DB:", retryError);
      }
    }

    console.error("Error en signup:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
