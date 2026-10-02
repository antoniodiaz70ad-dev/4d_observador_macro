import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toPublicSnapshot } from "@/lib/memory4d/observador-adapter";
import type { MemorySnapshot, MemoryState } from "@/packages/memory-4d/src";

export const dynamic = "force-dynamic";

type Memory4DAnalysis = {
  reading: string;
  tensions: string[];
  trajectory: string;
  nextDecision: string;
  confidence: number;
  model: string;
  source: "gemini" | "local-fallback";
};

const requestSchema = z.object({
  snapshotId: z.string().trim().min(1).max(240).optional(),
  entityId: z.string().trim().min(1).max(240).optional(),
});

function clamp(value: unknown, fallback = 0.5) {
  const number =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(1, number));
}

function sanitizeAnalysis(
  value: any,
  model: string,
  source: Memory4DAnalysis["source"],
): Memory4DAnalysis {
  return {
    reading: String(
      value?.reading ||
        "La captura muestra un estado observable, pero el analisis necesita mas historial para ser preciso.",
    ).slice(0, 900),
    tensions: Array.isArray(value?.tensions)
      ? value.tensions
          .slice(0, 5)
          .map((item: unknown) => String(item).slice(0, 220))
          .filter(Boolean)
      : [],
    trajectory: String(
      value?.trajectory ||
        "Registra dos o mas capturas para leer direccion temporal con mayor claridad.",
    ).slice(0, 900),
    nextDecision: String(
      value?.nextDecision ||
        "Guarda otra captura despues de la siguiente decision importante.",
    ).slice(0, 500),
    confidence: clamp(value?.confidence),
    model,
    source,
  };
}

function energyOf(state: MemoryState) {
  const value = state.metrics.energy?.value;
  return typeof value === "number" ? value : null;
}

function localAnalysis(
  snapshot: MemorySnapshot,
  selectedState?: MemoryState,
): Memory4DAnalysis {
  const states = snapshot.records.map((record) => record.state);
  const energies = states
    .map(energyOf)
    .filter((value): value is number => typeof value === "number");
  const avg = energies.length
    ? energies.reduce((sum, value) => sum + value, 0) / energies.length
    : null;
  const low = states
    .filter((state) => (energyOf(state) ?? 1) < 0.45)
    .slice(0, 3)
    .map((state) => `${state.entity.label}: energia baja o incierta`);
  const focus = selectedState ?? states[0];

  return sanitizeAnalysis(
    {
      reading:
        avg === null
          ? `La captura "${snapshot.label}" contiene ${states.length} estados, pero no hay energia suficiente para una lectura numerica.`
          : `La captura "${snapshot.label}" contiene ${states.length} estados con energia promedio de ${Math.round(avg * 100)}%. El foco actual es ${focus?.entity.label || "la red completa"}.`,
      tensions: low.length
        ? low
        : ["No hay tensiones fuertes detectadas con las metricas disponibles."],
      trajectory:
        "Analisis local: compara esta captura con capturas previas para ver si la energia sube, cae o se estanca.",
      nextDecision: focus
        ? `Decide una accion observable para ${focus.entity.label} y guarda una nueva captura despues.`
        : "Crea una captura con entidades activas y vuelve a analizar.",
      confidence: avg === null ? 0.35 : 0.55,
    },
    "local-rules",
    "local-fallback",
  );
}

function buildPrompt(snapshot: MemorySnapshot, selectedState?: MemoryState) {
  const states = snapshot.records.map((record) => record.state);
  const summary = states.slice(0, 18).map((state) => ({
    id: state.entity.id,
    label: state.entity.label,
    type: state.entity.type,
    energy: state.metrics.energy?.value ?? null,
    attributes: state.attributes,
    evidenceIds: state.evidenceIds,
  }));
  const decisions = snapshot.decisions.slice(0, 8).map((decision) => ({
    title: decision.title,
    context: decision.context,
    chosenAlternative: decision.chosenAlternative,
    assumptions: decision.assumptions.map((item) => item.claim),
    expectations: decision.expectations.map((item) => item.description),
    outcomes: decision.outcomes.map((item) => item.description),
    evaluation: decision.evaluation,
  }));

  return `Eres el analista temporal de Observador 4D. Lee una captura Memory 4D y devuelve solo JSON valido.

OBJETIVO
- Detectar patron actual, tensiones, trayectoria probable y siguiente decision concreta.
- Diferenciar hechos registrados de inferencias.
- No inventes datos fuera de la captura.
- Escribe en espanol claro y accionable.

CAPTURA
${JSON.stringify({
  id: snapshot.id,
  label: snapshot.label,
  capturedAt: snapshot.capturedAt,
  selectedEntity: selectedState
    ? {
        id: selectedState.entity.id,
        label: selectedState.entity.label,
        type: selectedState.entity.type,
        energy: selectedState.metrics.energy?.value ?? null,
        attributes: selectedState.attributes,
      }
    : null,
  states: summary,
  decisions,
  evidenceCount: snapshot.evidences.length,
})}

RESPONDE EXACTAMENTE CON ESTE JSON:
{
  "reading": "lectura sintetica de 2 a 4 frases",
  "tensions": ["tension o riesgo concreto", "otra tension si existe"],
  "trajectory": "como se ve la direccion temporal y que dato falta para confirmarla",
  "nextDecision": "una accion concreta que el usuario puede tomar ahora",
  "confidence": 0.0
}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body ?? {});
  if (!parsed.success)
    return NextResponse.json({ error: "Solicitud invalida" }, { status: 400 });

  try {
    const row = parsed.data.snapshotId
      ? await prisma.boardSnapshot.findFirst({
          where: { id: parsed.data.snapshotId, userId: session.user.id },
        })
      : await prisma.boardSnapshot.findFirst({
          where: { userId: session.user.id },
          orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
        });

    if (!row)
      return NextResponse.json(
        { error: "Captura no encontrada" },
        { status: 404 },
      );

    const snapshot = toPublicSnapshot(row.payload);
    const selectedState = parsed.data.entityId
      ? snapshot.records
          .map((record) => record.state)
          .find((state) => state.entity.id === parsed.data.entityId)
      : undefined;

    const apiKey =
      process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        analysis: localAnalysis(snapshot, selectedState),
        snapshotId: snapshot.id,
      });
    }

    const model = process.env.MEMORY_4D_GEMINI_MODEL || "gemini-2.0-flash";
    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model,
      contents: buildPrompt(snapshot, selectedState),
    });

    const raw = (result.text || "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    let parsedAnalysis: any;
    try {
      parsedAnalysis = JSON.parse(raw);
    } catch (error) {
      console.error("Respuesta no JSON de Gemini para Memory 4D:", raw);
      parsedAnalysis = localAnalysis(snapshot, selectedState);
    }

    return NextResponse.json({
      analysis: sanitizeAnalysis(parsedAnalysis, model, "gemini"),
      snapshotId: snapshot.id,
    });
  } catch (error: any) {
    console.error("Error analizando Memory 4D:", error);
    return NextResponse.json(
      {
        error: "No se pudo analizar Memory 4D",
        details: error?.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
