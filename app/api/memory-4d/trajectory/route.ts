import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toPublicSnapshot } from '@/lib/memory4d/observador-adapter';
import { buildTrail } from '@/packages/memory-4d/src';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const entityId = request.nextUrl.searchParams.get('entityId');
  if (!entityId || entityId.length > 240) return NextResponse.json({ error: 'Entidad invalida' }, { status: 400 });

  try {
    const rows = await prisma.boardSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
      take: 101,
      select: { id: true, payload: true },
    });
    const snapshots = rows.slice(0, 100).map(row => toPublicSnapshot(row.payload));
    return NextResponse.json({ trail: buildTrail(snapshots, entityId), hasMore: rows.length > 100 });
  } catch (error) {
    console.error('Error leyendo trayectoria Memory 4D:', error);
    return NextResponse.json({ error: 'No se pudo cargar la trayectoria' }, { status: 500 });
  }
}
