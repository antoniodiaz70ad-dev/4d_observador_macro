
'use client';

import { Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { CalendarDays, Cuboid, Home, Link2, Network, NotebookText, PlugZap, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Scene3D = dynamic(() => import('@/components/tablero3d/Scene3D').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#061225] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-t-cyan-300 border-r-violet-500 border-b-blue-500 border-l-cyan-300 rounded-full animate-spin mx-auto"></div>
        <p className="text-cyan-200 font-light text-lg">Inicializando mapa conectado...</p>
        <p className="text-slate-400 text-sm">Cargando nodos, vínculos y memoria del mapa</p>
      </div>
    </div>
  ),
});

const NAV_ITEMS = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Registro diario', href: '/registro-diario', icon: NotebookText },
  { label: 'Proyectos', href: '/projects', icon: Cuboid },
  { label: 'Relaciones', href: '/relationships', icon: Link2 },
  { label: 'Mapa 3D', href: '/tablero-3d', icon: Network, active: true },
  { label: 'Historial', href: '/memoria-4d', icon: CalendarDays },
  { label: 'Integraciones', href: '/projects-hub', icon: PlugZap },
];

export default function Tablero3DPage() {
  const router = useRouter();

  const handleZoomIn = useCallback(() => {
    window.dispatchEvent(new CustomEvent('scene3d-zoom', { detail: { action: 'in' } }));
  }, []);

  const handleZoomOut = useCallback(() => {
    window.dispatchEvent(new CustomEvent('scene3d-zoom', { detail: { action: 'out' } }));
  }, []);

  const handleResetView = useCallback(() => {
    window.dispatchEvent(new CustomEvent('scene3d-zoom', { detail: { action: 'reset' } }));
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050c19] text-slate-100">
      <aside className="absolute inset-y-0 left-0 z-[60] w-[292px] border-r border-cyan-200/10 bg-[#081629]/95 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <div className="flex h-full flex-col px-8 py-9">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex flex-col items-start gap-4 text-left"
            aria-label="Volver al dashboard"
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,0.25)]">
              <div className="h-12 w-12 rounded-full border-4 border-cyan-300/80 bg-gradient-to-br from-cyan-300/40 via-blue-500/40 to-violet-500/50" />
              <div className="absolute h-5 w-5 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-[0.18em] text-white">OBSERVADOR 4D</p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.35em] text-cyan-200/70">Ver más. Vivir mejor.</p>
            </div>
          </button>

          <nav className="mt-16 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`relative flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-base transition-all ${
                    item.active
                      ? 'bg-blue-600/25 text-cyan-200 shadow-lg shadow-blue-950/40 before:absolute before:left-[-32px] before:h-full before:w-1.5 before:rounded-r-full before:bg-cyan-300'
                      : 'text-blue-100/75 hover:bg-white/5 hover:text-cyan-100'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pb-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.38em] text-blue-200/60">Todo está conectado</p>
            <div className="mt-4 h-px w-10 bg-cyan-300" />
          </div>
        </div>
      </aside>

      <main className="relative ml-[292px] h-full overflow-hidden bg-[radial-gradient(circle_at_35%_35%,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_70%_42%,rgba(124,58,237,0.13),transparent_34%),#061225]">
        <div className="absolute right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-11 w-11 rounded-2xl border border-cyan-300/25 bg-slate-950/55 text-cyan-200 shadow-lg shadow-cyan-950/30 backdrop-blur hover:bg-cyan-400/15"
            aria-label="Acercar mapa"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-11 w-11 rounded-2xl border border-violet-300/25 bg-slate-950/55 text-violet-200 shadow-lg shadow-violet-950/30 backdrop-blur hover:bg-violet-400/15"
            aria-label="Alejar mapa"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetView}
            className="h-11 w-11 rounded-2xl border border-blue-300/25 bg-slate-950/55 text-blue-200 shadow-lg shadow-blue-950/30 backdrop-blur hover:bg-blue-400/15"
            aria-label="Restablecer vista"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <Suspense fallback={<div className="h-full w-full bg-[#061225]" />}>
          <Scene3D />
        </Suspense>
      </main>
    </div>
  );
}
