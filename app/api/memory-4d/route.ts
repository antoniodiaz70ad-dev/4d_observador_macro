import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildObservadorMemorySnapshot, toPublicSnapshot } from '@/lib/memory4d/observador-adapter';
import { queryAt } from '@/packages/memory-4d/src';

export const dynamic = 'force-dynamic';

async function currentMemorySnapshot(userId: string, label: string) {
  const [user, projects, relationships, intentions, manifestations, metrics, externalDecisions, agentDecisions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    prisma.project.findMany({ where: { userId, status: { in: ['active', 'paused'] } }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    prisma.relationship.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    prisma.intention.findMany({ where: { userId, status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    prisma.manifestation.findMany({ where: { userId, status: { in: ['intention', 'action', 'manifesting'] } }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    prisma.userMetrics.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.externalDecision.findMany({ where: { project: { userId } }, orderBy: { timestamp: 'desc' }, take: 25 }),
    prisma.agentDecision.findMany({ where: { project: { userId } }, orderBy: { timestamp: 'desc' }, take: 25 }),
  ]);

  return buildObservadorMemorySnapshot({
    ownerId: userId,
    label,
    user,
    projects,
    relationships,
    intentions,
    manifestations,
    metrics,
    externalDecisions,
    agentDecisions,
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  const eventTime = request.nextUrl.searchParams.get('eventTime');
  const knowledgeTime = request.nextUrl.searchParams.get('knowledgeTime');
  const mode = request.nextUrl.searchParams.get('mode');

  try {
    if (id) {
      const snapshot = await prisma.boardSnapshot.findFirst({ where: { id, userId: session.user.id } });
      if (!snapshot) return NextResponse.json({ error: 'Captura no encontrada' }, { status: 404 });
      return NextResponse.json({ snapshot: { ...snapshot, payload: toPublicSnapshot(snapshot.payload) } });
    }

    const rows = await prisma.boardSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
      take: 101,
      select: { id: true, label: true, capturedAt: true, schemaVersion: true, payload: true },
    });

    const snapshots = rows.slice(0, 100).map(row => ({
      id: row.id,
      label: row.label,
      capturedAt: row.capturedAt,
      schemaVersion: row.schemaVersion,
      payload: toPublicSnapshot(row.payload),
    }));

    if (eventTime && knowledgeTime && (mode === 'availableThen' || mode === 'currentKnowledgeAboutPast')) {
      const records = snapshots.flatMap(snapshot => snapshot.payload.records);
      const states = [...queryAt({ records, eventTime, knowledgeTime, mode }).values()];
      return NextResponse.json({ snapshots, states, hasMore: rows.length > 100 });
    }

    return NextResponse.json({ snapshots, hasMore: rows.length > 100 });
  } catch (error) {
    console.error('Error leyendo Memory 4D:', error);
    return NextResponse.json({ error: 'No se pudo cargar Memory 4D' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ label: z.string().trim().min(1).max(120) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Escribe un titulo de 1 a 120 caracteres' }, { status: 400 });

  try {
    const payload = await currentMemorySnapshot(session.user.id, parsed.data.label);
    const snapshot = await prisma.boardSnapshot.create({
      data: {
        userId: session.user.id,
        label: parsed.data.label,
        schemaVersion: 1,
        capturedAt: new Date(payload.capturedAt),
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ snapshot: { ...snapshot, payload } }, { status: 201 });
  } catch (error) {
    console.error('Error guardando Memory 4D:', error);
    return NextResponse.json({ error: 'No se pudo guardar la captura' }, { status: 500 });
  }
}
