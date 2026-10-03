import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface NodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  energy: number;
  label: string;
  color: string;
  type: 'self' | 'project' | 'relationship' | 'intention' | 'manifestation';
  metadata?: Record<string, any>;
}

interface LinkData {
  source: string;
  target: string;
  strength: number;
}

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
    const [user, projects, relationships, intentions, manifestations, metrics] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.project.findMany({
        where: { userId, status: { in: ['active', 'paused'] } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.relationship.findMany({
        where: { userId },
        orderBy: { connectionQuality: 'desc' },
        take: 10,
      }),
      prisma.intention.findMany({
        where: { userId, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.manifestation.findMany({
        where: { userId, status: { in: ['intention', 'action', 'manifesting'] } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.userMetrics.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
    ]);

    const nodes: NodeData[] = [];
    const links: LinkData[] = [];

    // Nodo central: El Observador (usuario)
    const observerEnergy = metrics?.overallCoherence ? metrics.overallCoherence / 100 : 0;
    nodes.push({
      id: 'observer',
      x: 0,
      y: 0,
      z: 60, // Altura máxima
      size: 4.0,
      energy: observerEnergy,
      label: user?.name || 'Observador 4D',
      color: TYPE_COLORS.self,
      type: 'self',
      metadata: {
        email: user?.email,
        coherence: metrics?.overallCoherence || 0,
      },
    });

    // Proyectos - Distribuidos en el primer anillo
    const projectRadius = 25;
    projects.forEach((project, index) => {
      const pos = distributeInCircle(index, Math.max(projects.length, 1), projectRadius);
      const energy = (project.progress / 100 + (project.energyInvested / 10)) / 2;
      const height = 20 + (project.progress / 100) * 30; // Altura basada en progreso
      
      nodes.push({
        id: `project_${project.id}`,
        x: pos.x,
        y: pos.y,
        z: height,
        size: 1.8 + (project.progress / 100) * 1.2,
        energy: Math.min(1, Math.max(0.1, energy)),
        label: project.name,
        color: TYPE_COLORS.project,
        type: 'project',
        metadata: {
          status: project.status,
          progress: project.progress,
          category: project.category,
        },
      });

      // Link al observador
      links.push({
        source: 'observer',
        target: `project_${project.id}`,
        strength: project.energyInvested / 10,
      });
    });

    // Relaciones - Distribuidas en el segundo anillo
    const relationshipRadius = 35;
    relationships.forEach((rel, index) => {
      const pos = distributeInCircle(index, Math.max(relationships.length, 1), relationshipRadius, 5, -5);
      const energy = rel.connectionQuality / 10;
      const height = 15 + (rel.connectionQuality / 10) * 35;
      
      nodes.push({
        id: `relationship_${rel.id}`,
        x: pos.x,
        y: pos.y,
        z: height,
        size: 1.6 + (rel.connectionQuality / 10) * 1.4,
        energy: Math.min(1, Math.max(0.1, energy)),
        label: rel.name,
        color: TYPE_COLORS.relationship,
        type: 'relationship',
        metadata: {
          type: rel.relationshipType,
          quality: rel.connectionQuality,
          energyExchange: rel.energyExchange,
          importance: rel.importance,
        },
      });

      // Link al observador
      links.push({
        source: 'observer',
        target: `relationship_${rel.id}`,
        strength: rel.connectionQuality / 10,
      });
    });

    // Intenciones - Distribuidas en el tercer anillo
    const intentionRadius = 40;
    intentions.forEach((intention, index) => {
      const pos = distributeInCircle(index, Math.max(intentions.length, 1), intentionRadius, -5, 10);
      const fulfillmentRate = intention.totalExpectedDays 
        ? intention.totalFulfilledDays / intention.totalExpectedDays 
        : intention.currentStreak / 30; // Aproximación si no hay días esperados
      const energy = Math.min(1, Math.max(0.1, fulfillmentRate));
      const height = 10 + fulfillmentRate * 40;
      
      nodes.push({
        id: `intention_${intention.id}`,
        x: pos.x,
        y: pos.y,
        z: height,
        size: 1.5 + fulfillmentRate * 1.0,
        energy,
        label: intention.title,
        color: TYPE_COLORS.intention,
        type: 'intention',
        metadata: {
          category: intention.category,
          frequency: intention.frequency,
          streak: intention.currentStreak,
          longestStreak: intention.longestStreak,
        },
      });

      // Link al observador
      links.push({
        source: 'observer',
        target: `intention_${intention.id}`,
        strength: energy,
      });
    });

    // Manifestaciones - Distribuidas en el cuarto anillo
    const manifestationRadius = 45;
    manifestations.forEach((manifestation, index) => {
      const pos = distributeInCircle(index, Math.max(manifestations.length, 1), manifestationRadius, 10, 5);
      const progress = manifestation.manifestationStage / 100;
      const energy = Math.min(1, Math.max(0.1, progress));
      const height = 8 + progress * 45;
      
      nodes.push({
        id: `manifestation_${manifestation.id}`,
        x: pos.x,
        y: pos.y,
        z: height,
        size: 1.8 + progress * 1.2,
        energy,
        label: manifestation.title,
        color: TYPE_COLORS.manifestation,
        type: 'manifestation',
        metadata: {
          status: manifestation.status,
          stage: manifestation.manifestationStage,
          category: manifestation.category,
          timeframe: manifestation.timeframe,
          impactLevel: manifestation.impactLevel,
        },
      });

      // Link al observador
      links.push({
        source: 'observer',
        target: `manifestation_${manifestation.id}`,
        strength: manifestation.energyRequired / 10,
      });
    });

    // Crear links entre elementos relacionados
    // Conectar proyectos con relaciones relacionadas
    projects.forEach((project) => {
      if (project.relatedPeople && project.relatedPeople.length > 0) {
        project.relatedPeople.forEach((relId) => {
          const relNode = nodes.find(n => n.id === `relationship_${relId}`);
          if (relNode) {
            links.push({
              source: `project_${project.id}`,
              target: `relationship_${relId}`,
              strength: 0.5,
            });
          }
        });
      }
    });

    // Calcular estadísticas
    const totalNodes = nodes.length;
    const avgEnergy = nodes.reduce((acc, n) => acc + n.energy, 0) / totalNodes;
    const totalConnections = links.length;

    // Métricas adicionales
    const stats = {
      total: totalNodes,
      avgEnergy: Math.round(avgEnergy * 100),
      connections: totalConnections,
      breakdown: {
        projects: projects.length,
        relationships: relationships.length,
        intentions: intentions.length,
        manifestations: manifestations.length,
      },
      coherence: {
        overall: metrics?.overallCoherence || 0,
        emotional: metrics?.emotionalCoherence || 0,
        logical: metrics?.logicalCoherence || 0,
        energetic: metrics?.energeticCoherence || 0,
      },
    };

    return NextResponse.json({
      success: true,
      nodes,
      links,
      stats,
    });

  } catch (error) {
    console.error('Error en /api/tablero-3d:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos del tablero', details: (error as Error).message },
      { status: 500 }
    );
  }
}



