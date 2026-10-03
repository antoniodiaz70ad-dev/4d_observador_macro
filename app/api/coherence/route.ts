
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    const [projectCount, relationshipCount, entryCount, latestMetrics] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.relationship.count({ where: { userId } }),
      prisma.dailyEntry.count({ where: { userId } }),
      prisma.userMetrics.findFirst({
        where: { userId },
        orderBy: { date: 'desc' }
      })
    ]);

    const hasMinimumSignals = projectCount > 0 && relationshipCount > 0 && entryCount > 0;

    if (!latestMetrics || !hasMinimumSignals) {
      return NextResponse.json({
        overallCoherence: 0,
        emotionalCoherence: 0,
        logicalCoherence: 0,
        energeticCoherence: 0,
        synchronicityCount: 0,
        synchronicityScore: 0,
        manifestationRate: 0,
        projectCompletion: 0,
        relationshipHealth: 0,
        weeklyTrend: 'empty',
        source: 'insufficient_signals',
        signalCounts: { projects: projectCount, relationships: relationshipCount, entries: entryCount },
        message: 'Sin datos suficientes para calcular coherencia'
      });
    }

    return NextResponse.json({
      ...latestMetrics,
      source: 'user_metrics',
      signalCounts: { projects: projectCount, relationships: relationshipCount, entries: entryCount }
    });
  } catch (error) {
    console.error('Error obteniendo métricas de coherencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    const {
      emotionalCoherence,
      logicalCoherence,
      energeticCoherence
    } = data;

    // Calcular coherencia general
    const overallCoherence = (emotionalCoherence + logicalCoherence + energeticCoherence) / 3;

    // Actualizar o crear métricas
    const metrics = await prisma.userMetrics.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date()
        }
      },
      update: {
        emotionalCoherence,
        logicalCoherence,
        energeticCoherence,
        overallCoherence
      },
      create: {
        userId,
        emotionalCoherence,
        logicalCoherence,
        energeticCoherence,
        overallCoherence,
        synchronicityCount: 0,
        manifestationRate: 50.0,
        projectCompletion: 30.0,
        relationshipHealth: 70.0
      }
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error actualizando métricas de coherencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
