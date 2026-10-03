
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

    // Calcular flujos de energía basados en proyectos y relaciones
    const projects = await prisma.project.findMany({
      where: { 
        userId,
        status: 'active'
      },
      select: {
        category: true,
        energyInvested: true,
        name: true
      }
    });

    const relationships = await prisma.relationship.findMany({
      where: { userId },
      select: {
        relationshipType: true,
        energyExchange: true,
        connectionQuality: true,
        name: true
      }
    });

    // Agrupar energía por categorías
    const energyByCategory: Record<string, number> = {};

    // Energía invertida en proyectos: suma directa de energyInvested (1-10) por categoría.
    projects.forEach(project => {
      const category = project.category || 'personal';
      energyByCategory[category] = (energyByCategory[category] || 0) + project.energyInvested;
    });

    // Energía en relaciones
    relationships.forEach(relationship => {
      const category = `relaciones_${relationship.relationshipType}`;
      let energyValue = 0;
      
      switch (relationship.energyExchange) {
        case 'giving':
          energyValue = relationship.connectionQuality * 0.8;
          break;
        case 'receiving':
          energyValue = relationship.connectionQuality * 0.4;
          break;
        case 'balanced':
          energyValue = relationship.connectionQuality * 0.6;
          break;
        case 'draining':
          energyValue = relationship.connectionQuality * -0.3;
          break;
        default:
          energyValue = relationship.connectionQuality * 0.5;
      }
      
      energyByCategory[category] = (energyByCategory[category] || 0) + Math.max(0, energyValue);
    });

    // Normalizar valores a porcentajes
    const totalEnergy = Object.values(energyByCategory).reduce((sum, value) => sum + value, 0);
    const normalizedFlows = Object.entries(energyByCategory).map(([category, value]) => ({
      category: category.replace('relaciones_', ''),
      rawCategory: category,
      rawValue: Math.round(value * 10) / 10,
      value: totalEnergy > 0 ? Math.round((value / totalEnergy) * 100) : 0,
      label: getCategoryLabel(category)
    }));

    // No agregamos categorías demostrativas: si no hay proyectos o relaciones, no hay fuente para calcular porcentajes.
    const currentTotal = normalizedFlows.reduce((sum, flow) => sum + flow.value, 0);
    if (currentTotal !== 100 && currentTotal > 0) {
      const factor = 100 / currentTotal;
      normalizedFlows.forEach(flow => {
        flow.value = Math.round(flow.value * factor);
      });
    }

    // Obtener flujos de energía detallados
    const detailedFlows = {
      inputs: relationships
        .filter(rel => rel.energyExchange === 'receiving' || rel.energyExchange === 'balanced')
        .map(rel => ({
          source: rel.name,
          type: rel.relationshipType,
          value: rel.connectionQuality,
          quality: rel.energyExchange
        })),
      outputs: [
        ...projects.map(proj => ({
          target: proj.name,
          type: 'project',
          value: proj.energyInvested,
          category: proj.category
        })),
        ...relationships
          .filter(rel => rel.energyExchange === 'giving' || rel.energyExchange === 'draining')
          .map(rel => ({
            target: rel.name,
            type: 'relationship',
            value: rel.connectionQuality,
            quality: rel.energyExchange
          }))
      ]
    };

    return NextResponse.json({
      flows: normalizedFlows.sort((a, b) => b.value - a.value),
      detailed: detailedFlows,
      source: normalizedFlows.length > 0 ? 'user_projects_relationships' : 'insufficient_signals',
      signalCounts: { projects: projects.length, relationships: relationships.length },
      calculation: {
        formula: 'porcentaje = valor bruto de categoría / suma de valores brutos × 100',
        totalRawEnergy: Math.round(totalEnergy * 10) / 10,
        inputs: {
          projects: 'energyInvested por proyecto activo, escala 1-10',
          relationships: 'connectionQuality × factor de intercambio energético',
        },
        exchangeFactors: {
          giving: 0.8,
          receiving: 0.4,
          balanced: 0.6,
          draining: -0.3,
          default: 0.5,
        },
      },
      summary: {
        totalActive: normalizedFlows.length,
        highestFlow: normalizedFlows[0]?.label || 'Ninguno',
        energyBalance: normalizedFlows.length > 0 ? calculateEnergyBalance(detailedFlows) : 'sin datos'
      }
    });
  } catch (error) {
    console.error('Error obteniendo flujos de energía:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { flows } = data;

    // Esta funcionalidad se implementaría para permitir al usuario
    // ajustar manualmente la distribución de energía
    // Por ahora, simplemente devolvemos los datos normalizados

    const normalizedFlows = flows.map((flow: any) => ({
      ...flow,
      value: Math.max(0, Math.min(100, flow.value))
    }));

    // Rebalancear para que sume 100%
    const total = normalizedFlows.reduce((sum: number, flow: any) => sum + flow.value, 0);
    if (total !== 100 && total > 0) {
      const factor = 100 / total;
      normalizedFlows.forEach((flow: any) => {
        flow.value = Math.round(flow.value * factor);
      });
    }

    return NextResponse.json({
      flows: normalizedFlows,
      message: 'Flujos de energía actualizados correctamente'
    });
  } catch (error) {
    console.error('Error actualizando flujos de energía:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'trabajo': '🏢 Trabajo',
    'personal': '🏠 Personal',
    'profesional': '💼 Profesional', 
    'salud': '⚡ Salud',
    'creatividad': '🎨 Creatividad',
    'espiritualidad': '🔮 Espiritualidad',
    'spiritual': '🔮 Espiritual',
    'mentor': '🎓 Mentoría',
    'family': '👨‍👩‍👧‍👦 Familia',
    'professional': '💼 Profesional',
    'relaciones_professional': '🤝 Relaciones profesionales',
    'relaciones_personal': '💗 Relaciones personales',
    'relaciones_spiritual': '🔮 Relaciones espirituales',
    'relaciones_mentor': '🎓 Mentorías',
    'relaciones_family': '👨‍👩‍👧‍👦 Familia'
  };
  
  return labels[category] || `✨ ${humanizeToken(category)}`;
}

function calculateEnergyBalance(flows: any): string {
  const inputTotal = flows.inputs?.reduce((sum: number, input: any) => sum + input.value, 0) || 0;
  const outputTotal = flows.outputs?.reduce((sum: number, output: any) => sum + output.value, 0) || 0;
  
  if (inputTotal > outputTotal * 1.2) return 'recibiendo';
  if (outputTotal > inputTotal * 1.2) return 'dando';
  return 'equilibrado';
}


function humanizeToken(value: string): string {
  const normalized = value.replace(/^relaciones_/, '').replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
