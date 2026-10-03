/**
 * API de Modo Decisión - OBSERVADOR4D
 * 
 * Calcula métricas ejecutivas para la toma de decisiones rápida.
 * Objetivo: CEO entiende el sistema en menos de 5 minutos.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyzeSystem, NodeData, LinkData } from '@/lib/nodeInterpreter';

// Colores por tipo
const TYPE_COLORS = {
  self: '#00ffff',
  project: '#ff00ff',
  relationship: '#ffaa00',
  intention: '#00ff88',
  manifestation: '#ff0088',
};

// Función para distribuir nodos en un círculo
function distributeInCircle(index: number, total: number, radius: number, centerX = 0, centerY = 0) {
  const angle = (2 * Math.PI * index) / total;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener datos del usuario en paralelo
    const [user, projects, relationships, intentions, manifestations, metrics, dailyEntryCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.project.findMany({
        where: { userId, status: { in: ['active', 'paused'] } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.relationship.findMany({
        where: { userId },
        orderBy: { connectionQuality: 'desc' },
        take: 20,
      }),
      prisma.intention.findMany({
        where: { userId, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.manifestation.findMany({
        where: { userId, status: { in: ['intention', 'action', 'manifesting'] } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.userMetrics.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.dailyEntry.count({ where: { userId } }),
    ]);

    const nodes: NodeData[] = [];
    const links: LinkData[] = [];

    // Nodo central: El Observador (usuario)
    const observerEnergy = metrics?.overallCoherence ? metrics.overallCoherence / 100 : 0.75;
    nodes.push({
      id: 'observer',
      x: 0,
      y: 0,
      z: 60,
      size: 4.0,
      energy: observerEnergy,
      label: user?.name || 'Observador 4D',
      color: TYPE_COLORS.self,
      type: 'self',
      coherence: observerEnergy,
    });

    // Proyectos
    const projectRadius = 25;
    projects.forEach((project, index) => {
      const pos = distributeInCircle(index, Math.max(projects.length, 1), projectRadius);
      const energy = (project.progress / 100 + (project.energyInvested / 10)) / 2;
      const coherence = project.progress > 50 ? energy * 1.1 : energy * 0.8;
      
      nodes.push({
        id: `project_${project.id}`,
        x: pos.x,
        y: pos.y,
        z: 20 + (project.progress / 100) * 30,
        size: 1.8 + (project.progress / 100) * 1.2,
        energy: Math.min(1, Math.max(0.1, energy)),
        label: project.name,
        color: TYPE_COLORS.project,
        type: 'project',
        coherence: Math.min(1, Math.max(0.1, coherence)),
      });

      links.push({
        source: 'observer',
        target: `project_${project.id}`,
        strength: project.energyInvested / 10,
      });
    });

    // Relaciones
    const relationshipRadius = 35;
    relationships.forEach((rel, index) => {
      const pos = distributeInCircle(index, Math.max(relationships.length, 1), relationshipRadius, 5, -5);
      const energy = rel.connectionQuality / 10;
      const exchangeMultiplier: Record<string, number> = {
        balanced: 1.05,
        receiving: 0.95,
        giving: 0.85,
        draining: 0.45,
      };
      const coherence = energy * (exchangeMultiplier[rel.energyExchange] ?? 0.75);
      
      nodes.push({
        id: `relationship_${rel.id}`,
        x: pos.x,
        y: pos.y,
        z: 15 + (rel.connectionQuality / 10) * 35,
        size: 1.6 + (rel.connectionQuality / 10) * 1.4,
        energy: Math.min(1, Math.max(0.1, energy)),
        label: rel.name,
        color: TYPE_COLORS.relationship,
        type: 'relationship',
        coherence: Math.min(1, Math.max(0.1, coherence)),
      });

      links.push({
        source: 'observer',
        target: `relationship_${rel.id}`,
        strength: rel.connectionQuality / 10,
      });
    });

    // Intenciones
    const intentionRadius = 40;
    intentions.forEach((intention, index) => {
      const pos = distributeInCircle(index, Math.max(intentions.length, 1), intentionRadius, -5, 10);
      const fulfillmentRate = intention.totalExpectedDays 
        ? intention.totalFulfilledDays / intention.totalExpectedDays 
        : intention.currentStreak / 30;
      const energy = Math.min(1, Math.max(0.1, fulfillmentRate));
      const coherence = intention.currentStreak > 7 ? energy * 1.1 : energy * 0.9;
      
      nodes.push({
        id: `intention_${intention.id}`,
        x: pos.x,
        y: pos.y,
        z: 10 + fulfillmentRate * 40,
        size: 1.5 + fulfillmentRate * 1.0,
        energy,
        label: intention.title,
        color: TYPE_COLORS.intention,
        type: 'intention',
        coherence: Math.min(1, Math.max(0.1, coherence)),
      });

      links.push({
        source: 'observer',
        target: `intention_${intention.id}`,
        strength: energy,
      });
    });

    // Manifestaciones
    const manifestationRadius = 45;
    manifestations.forEach((manifestation, index) => {
      const pos = distributeInCircle(index, Math.max(manifestations.length, 1), manifestationRadius, 10, 5);
      const progress = manifestation.manifestationStage / 100;
      const energy = Math.min(1, Math.max(0.1, progress));
      const coherence = manifestation.impactLevel ? manifestation.impactLevel / 10 : energy;
      
      nodes.push({
        id: `manifestation_${manifestation.id}`,
        x: pos.x,
        y: pos.y,
        z: 8 + progress * 45,
        size: 1.8 + progress * 1.2,
        energy,
        label: manifestation.title,
        color: TYPE_COLORS.manifestation,
        type: 'manifestation',
        coherence: Math.min(1, Math.max(0.1, coherence)),
      });

      links.push({
        source: 'observer',
        target: `manifestation_${manifestation.id}`,
        strength: manifestation.energyRequired / 10,
      });
    });

    const sufficiencySignals = {
      projects: projects.length > 0,
      relationships: relationships.length > 0,
      dailyEntries: dailyEntryCount > 0,
    };
    const sufficientEvidence = sufficiencySignals.projects && sufficiencySignals.relationships && sufficiencySignals.dailyEntries;
    const missingSignals = [
      !sufficiencySignals.projects ? 'un proyecto' : null,
      !sufficiencySignals.relationships ? 'una relación' : null,
      !sufficiencySignals.dailyEntries ? 'un registro diario' : null,
    ].filter(Boolean) as string[];

    // Analizar el sistema con el Motor de Significado
    const systemCoherence = metrics ? {
      overall: metrics.overallCoherence || 0,
      emotional: metrics.emotionalCoherence || 0,
      logical: metrics.logicalCoherence || 0,
      energetic: metrics.energeticCoherence || 0,
    } : undefined;

    const analysis = sufficientEvidence
      ? analyzeSystem(nodes, links, systemCoherence)
      : {
          healthScore: 0,
          topCritical: [],
          bottleneck: null,
          globalRecommendation: {
            action: 'Mantener' as const,
            target: 'Evidencia pendiente',
            reason: `Falta ${missingSignals.join(', ')} para emitir una recomendación ejecutiva.`,
          },
        };

    return NextResponse.json({
      success: true,
      ...analysis,
      metadata: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        breakdown: {
          projects: projects.length,
          relationships: relationships.length,
          intentions: intentions.length,
          manifestations: manifestations.length,
          dailyEntries: dailyEntryCount,
        },
        sufficiency: {
          required: ['proyecto', 'relación', 'registro diario'],
          ready: sufficientEvidence,
          readyCount: [sufficiencySignals.projects, sufficiencySignals.relationships, sufficiencySignals.dailyEntries].filter(Boolean).length,
          totalRequired: 3,
          missing: missingSignals,
          message: sufficientEvidence
            ? 'Modo Decisión calculado con proyecto, relación y registro diario.'
            : `Sin evidencia suficiente para recomendar. Falta ${missingSignals.join(', ')}.`,
        },
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error en /api/decision-mode:', error);
    return NextResponse.json(
      { error: 'Error al calcular modo decisión', details: (error as Error).message },
      { status: 500 }
    );
  }
}

