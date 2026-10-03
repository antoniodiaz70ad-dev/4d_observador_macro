
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
  { label: 'Registro diario', href: '/daily-mapping', icon: NotebookText },
  { label: 'Proyectos', href: '/dashboard?focus=projects', icon: Cuboid },
  { label: 'Relaciones', href: '/dashboard?focus=relationships', icon: Link2 },
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
      <aside className="absolute inset-y-0 left-0 z-[60] w-[236px] border-r border-cyan-200/10 bg-[#081629]/95 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <div className="flex h-full flex-col px-7 py-7">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex flex-col items-start gap-4 text-left"
            aria-label="Volver al dashboard"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,0.25)]">
              <div className="h-10 w-10 rounded-full border-4 border-cyan-300/80 bg-gradient-to-br from-cyan-300/40 via-blue-500/40 to-violet-500/50" />
              <div className="absolute h-4 w-4 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
            </div>
            <div>
              <p className="whitespace-nowrap text-[16px] font-semibold tracking-[0.1em] text-white">OBSERVADOR 4D</p>
              <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.28em] text-cyan-200/70">Ver más. Vivir mejor.</p>
            </div>
          </button>

          <nav className="mt-14 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[15px] transition-all ${
                    item.active
                      ? 'bg-blue-600/25 text-cyan-200 shadow-lg shadow-blue-950/40 before:absolute before:left-[-28px] before:h-full before:w-1.5 before:rounded-r-full before:bg-cyan-300'
                      : 'text-blue-100/75 hover:bg-white/5 hover:text-cyan-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pb-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-blue-200/60">Todo está conectado</p>
            <div className="mt-4 h-px w-10 bg-cyan-300" />
          </div>
        </div>
      </aside>

      <main className="relative ml-[236px] h-full overflow-hidden bg-[radial-gradient(circle_at_42%_34%,rgba(14,165,233,0.09),transparent_31%),radial-gradient(circle_at_70%_42%,rgba(124,58,237,0.08),transparent_34%),#030816]">
        <div className="absolute right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-10 w-10 rounded-xl border border-cyan-300/25 bg-slate-950/55 text-cyan-200 shadow-lg shadow-cyan-950/30 backdrop-blur hover:bg-cyan-400/15"
            aria-label="Acercar mapa"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-10 w-10 rounded-xl border border-violet-300/25 bg-slate-950/55 text-violet-200 shadow-lg shadow-violet-950/30 backdrop-blur hover:bg-violet-400/15"
            aria-label="Alejar mapa"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetView}
            className="h-10 w-10 rounded-xl border border-blue-300/25 bg-slate-950/55 text-blue-200 shadow-lg shadow-blue-950/30 backdrop-blur hover:bg-blue-400/15"
            aria-label="Restablecer vista"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Suspense fallback={<div className="h-full w-full bg-[#061225]" />}>
          <Scene3D />
        </Suspense>
      </main>
    </div>
  );
}
