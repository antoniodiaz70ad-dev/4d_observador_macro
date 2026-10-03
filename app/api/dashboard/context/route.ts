/**
 * API de Contexto Visual del Dashboard - OBSERVADOR4D
 * 
 * Devuelve un resumen COMPACTO del estado actual del dashboard
 * optimizado para enviar al chatbot sin sobrecargar tokens.
 * 
 * Máximo ~500 tokens de contexto visual.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Tipos para datos seleccionados
type ProjectSelect = {
  id: string;
  name: string;
  progress: number | null;
  satisfactionLevel: number | null;
  status: string;
};

type RelationshipSelect = {
  id: string;
  name: string;
  importance: number | null;
  connectionQuality: number;
};

type IntentionSelect = {
  id: string;
  title: string;
  frequency: string;
  totalFulfilledDays: number;
  totalExpectedDays: number | null;
  status: string;
};

type ManifestationSelect = {
  id: string;
  title: string;
  manifestationStage: number | null;
  impactLevel: number | null;
};

type SnapshotSelect = {
  nodeId: string;
  coherence: number;
  energy: number;
};

interface CompactNode {
  id: string;
  name: string;
  type: 'P' | 'R' | 'I' | 'M'; // Project, Relationship, Intention, Manifestation
  coh: number; // coherence 0-100
  ene: number; // energy 0-100
  con: number; // connections count
  status: string; // Flujo, Fricción, etc.
}

interface DashboardContext {
  summary: string; // Resumen en 1 línea
  globalCoh: number;
  globalEne: number;
  totalNodes: number;
  critical: CompactNode[]; // Solo nodos críticos (max 3)
  attention: CompactNode[]; // Nodos que necesitan atención (max 3)
  healthy: number; // Cantidad de nodos saludables
  trends: {
    up: number;
    down: number;
    stable: number;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener todos los datos del usuario en paralelo
    const [projects, relationships, intentions, manifestations] = await Promise.all([
      prisma.project.findMany({ where: { userId }, select: { 
        id: true, name: true, progress: true, satisfactionLevel: true, status: true 
      }}),
      prisma.relationship.findMany({ where: { userId }, select: { 
        id: true, name: true, importance: true, connectionQuality: true
      }}),
      prisma.intention.findMany({ where: { userId }, select: { 
        id: true, title: true, frequency: true, totalFulfilledDays: true, totalExpectedDays: true, status: true
      }}),
      prisma.manifestation.findMany({ where: { userId }, select: { 
        id: true, title: true, manifestationStage: true, impactLevel: true 
      }})
    ]);

    // Obtener snapshots recientes para tendencias (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentSnapshots = await prisma.nodeSnapshot.findMany({
      where: { 
        userId, 
        createdAt: { gte: weekAgo } 
      },
      orderBy: { createdAt: 'desc' },
      select: { nodeId: true, coherence: true, energy: true }
    });

    // Procesar nodos y calcular métricas
    const allNodes: CompactNode[] = [];
    let totalCoh = 0;
    let totalEne = 0;

    // Proyectos
    (projects as ProjectSelect[]).forEach((p) => {
      const coh = Math.round(((p.progress || 0) / 100 + (p.satisfactionLevel || 5) / 10) / 2 * 100);
      const ene = Math.round((p.progress || 0));
      const status = getStatus(coh);
      
      allNodes.push({
        id: `project_${p.id}`,
        name: p.name.substring(0, 20),
        type: 'P',
        coh,
        ene,
        con: 1, // Simplificado
        status
      });
      totalCoh += coh;
      totalEne += ene;
    });

    // Relaciones
    (relationships as RelationshipSelect[]).forEach((r) => {
      const coh = Math.round(((r.importance ?? 5) / 10) * 100);
      const ene = Math.round(((r.connectionQuality ?? 5) / 10) * 100);
      const status = getStatus(coh);
      
      allNodes.push({
        id: `relationship_${r.id}`,
        name: r.name.substring(0, 20),
        type: 'R',
        coh,
        ene,
        con: 1,
        status
      });
      totalCoh += coh;
      totalEne += ene;
    });

    // Intenciones
    (intentions as IntentionSelect[]).forEach((i) => {
      const expectedDays = i.totalExpectedDays ?? 1;
      const fulfillment = expectedDays > 0 
        ? i.totalFulfilledDays / expectedDays 
        : 0.5;
      const coh = Math.round(Math.min(fulfillment, 1) * 100);
      const ene = i.frequency === 'daily' ? 90 : i.frequency === 'weekly' ? 60 : 30;
      const nodeStatus = getStatus(coh);
      
      allNodes.push({
        id: `intention_${i.id}`,
        name: i.title.substring(0, 20),
        type: 'I',
        coh,
        ene,
        con: 1,
        status: nodeStatus
      });
      totalCoh += coh;
      totalEne += ene;
    });

    // Manifestaciones
    (manifestations as ManifestationSelect[]).forEach((m) => {
      const coh = Math.round(((m.manifestationStage ?? 0) / 5) * 100);
      const ene = Math.round(((m.impactLevel ?? 5) / 10) * 100);
      const status = getStatus(coh);
      
      allNodes.push({
        id: `manifestation_${m.id}`,
        name: m.title.substring(0, 20),
        type: 'M',
        coh,
        ene,
        con: 1,
        status
      });
      totalCoh += coh;
      totalEne += ene;
    });

    // Calcular globales
    const totalNodes = allNodes.length;
    const globalCoh = totalNodes > 0 ? Math.round(totalCoh / totalNodes) : 0;
    const globalEne = totalNodes > 0 ? Math.round(totalEne / totalNodes) : 0;

    // Identificar nodos críticos (coherencia < 40%)
    const critical = allNodes
      .filter(n => n.coh < 40)
      .sort((a, b) => a.coh - b.coh)
      .slice(0, 3);

    // Identificar nodos que necesitan atención (coherencia 40-60%)
    const attention = allNodes
      .filter(n => n.coh >= 40 && n.coh < 60)
      .sort((a, b) => a.coh - b.coh)
      .slice(0, 3);

    // Nodos saludables
    const healthy = allNodes.filter(n => n.coh >= 60).length;

    // Calcular tendencias basadas en snapshots
    const nodeSnapshots = new Map<string, number[]>();
    (recentSnapshots as SnapshotSelect[]).forEach((s) => {
      if (!nodeSnapshots.has(s.nodeId)) {
        nodeSnapshots.set(s.nodeId, []);
      }
      nodeSnapshots.get(s.nodeId)!.push(s.coherence);
    });

    let trendsUp = 0, trendsDown = 0, trendsStable = 0;
    nodeSnapshots.forEach((cohValues) => {
      if (cohValues.length >= 2) {
        const diff = cohValues[0] - cohValues[cohValues.length - 1];
        if (diff > 0.1) trendsUp++;
        else if (diff < -0.1) trendsDown++;
        else trendsStable++;
      }
    });

    // Generar resumen compacto
    const globalStatus = getStatus(globalCoh);
    const summary = totalNodes > 0
      ? `${totalNodes} nodos | Coherencia ${globalCoh}% (${globalStatus}) | Energía ${globalEne}% | ${critical.length} críticos | ${trendsUp}↑ ${trendsDown}↓`
      : 'Sin nodos registrados | Registra un proyecto, relación o intención para calcular indicadores';

    const context: DashboardContext = {
      summary,
      globalCoh,
      globalEne,
      totalNodes,
      critical,
      attention,
      healthy,
      trends: {
        up: trendsUp,
        down: trendsDown,
        stable: trendsStable
      }
    };

    return NextResponse.json({
      success: true,
      context,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en /api/dashboard/context:', error);
    return NextResponse.json(
      { error: 'Error al obtener contexto', details: error?.message },
      { status: 500 }
    );
  }
}

function getStatus(coherence: number): string {
  if (coherence >= 80) return 'Flujo';
  if (coherence >= 60) return 'Expansión';
  if (coherence >= 40) return 'Fricción';
  if (coherence >= 20) return 'Saturación';
  return 'Colapso';
}

