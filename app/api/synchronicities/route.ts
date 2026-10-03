
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

    // Obtener sincronicidades de las entradas diarias recientes
    const recentEntries = await prisma.dailyEntry.findMany({
      where: { 
        userId
      },
      orderBy: { date: 'desc' },
      take: 30
    });

    // Extraer y procesar sincronicidades
    const synchronicities = recentEntries
      .filter(entry => entry.synchronicitiesData && Array.isArray(entry.synchronicitiesData))
      .map(entry => {
        const syncs = entry.synchronicitiesData as any[];
        return syncs.map(sync => ({
          ...sync,
          date: entry.date
        }));
      })
      .flat()
      .slice(0, 20);

    // Obtener métricas de sincronicidad
    const metrics = await prisma.userMetrics.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        synchronicityCount: true,
        synchronicityScore: true,
        manifestationRate: true
      }
    });

    const hasRealSynchronicities = synchronicities.length > 0;

    return NextResponse.json({
      synchronicities,
      metrics: {
        synchronicityCount: synchronicities.length,
        synchronicityScore: hasRealSynchronicities ? (metrics?.synchronicityScore || 0) : 0,
        manifestationRate: hasRealSynchronicities ? (metrics?.manifestationRate || 0) : 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo sincronicidades:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Buscar entrada del día o crearla
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyEntry = await prisma.dailyEntry.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!dailyEntry) {
      dailyEntry = await prisma.dailyEntry.create({
        data: {
          userId,
          date: today,
          emotionalState: 5.0,
          energyLevel: 5.0,
          synchronicitiesData: []
        }
      });
    }

    // Agregar nueva sincronicidad
    const currentSyncs = (dailyEntry.synchronicitiesData as any[]) || [];
    const newSync = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      impact: data.impact || 5,
      timestamp: new Date().toISOString(),
      category: data.category || 'general'
    };

    const updatedEntry = await prisma.dailyEntry.update({
      where: { id: dailyEntry.id },
      data: {
        synchronicitiesData: [...currentSyncs, newSync]
      }
    });

    // Actualizar métricas de sincronicidad
    await prisma.userMetrics.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        synchronicityCount: currentSyncs.length + 1,
        synchronicityScore: Math.min(95, (currentSyncs.length + 1) * 15)
      },
      create: {
        userId,
        date: today,
        overallCoherence: 60.0,
        emotionalCoherence: 60.0,
        logicalCoherence: 60.0,
        energeticCoherence: 60.0,
        synchronicityCount: 1,
        synchronicityScore: 15,
        manifestationRate: 50.0,
        projectCompletion: 30.0,
        relationshipHealth: 70.0
      }
    });

    return NextResponse.json(newSync);
  } catch (error) {
    console.error('Error registrando sincronicidad:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
