import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'cyan' | 'purple' | 'yellow' | 'slate';

const toneClasses: Record<Tone, string> = {
  cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  purple: 'border-purple-400/20 bg-purple-400/10 text-purple-100',
  yellow: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-100',
  slate: 'border-slate-500/30 bg-slate-900/55 text-slate-100',
};

export function DataSourceNote({
  title,
  children,
  tone = 'cyan',
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border p-4', toneClasses[tone], className)}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 text-xs leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function IndicatorClarity({ className }: { className?: string }) {
  const items = [
    {
      name: 'Energía',
      text: 'atención, esfuerzo o recursos que registras en proyectos y relaciones. Es una autoevaluación, no una medición física.',
    },
    {
      name: 'Coherencia',
      text: 'lectura de alineación entre señales emocionales, lógicas y energéticas. Solo se calcula cuando hay evidencia suficiente.',
    },
    {
      name: 'Flujo',
      text: 'distribución calculada a partir de los valores registrados. Debe mostrar fuente, fórmula y fecha cuando aplique.',
    },
    {
      name: 'Manifestación',
      text: 'intención o resultado esperado que se puede seguir en el tiempo. No es una garantía ni una predicción.',
    },
  ];

  return (
    <div className={cn('rounded-2xl border border-cyan-400/20 bg-slate-950/60 p-4', className)}>
      <p className="text-sm font-semibold text-cyan-100">Cómo leer estos indicadores</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(item => (
          <p key={item.name} className="text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-100">{item.name}:</span> {item.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function HistoryClarity({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4', className)}>
      <p className="text-sm font-semibold text-blue-100">Qué guarda cada historial</p>
      <div className="mt-2 grid gap-2 text-xs leading-relaxed text-slate-300 sm:grid-cols-3">
        <p><span className="font-semibold text-white">Historial diario:</span> eventos, decisiones y registros por fecha.</p>
        <p><span className="font-semibold text-white">Evolución de nodos:</span> cambios automáticos o manuales del mapa para energía, coherencia y conexiones.</p>
        <p><span className="font-semibold text-white">Memory 4D:</span> capturas guardadas para comparar evidencia antes y después de una decisión.</p>
      </div>
    </div>
  );
}
