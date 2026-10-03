import Link from 'next/link';
import { ArrowRight, Eye, Fingerprint, LogIn, Network, Sparkles, TimerReset } from 'lucide-react';

function HorusEyeMark() {
  return (
    <div className="relative mx-auto h-[260px] w-[340px] max-w-[82vw] md:h-[360px] md:w-[520px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/20 blur-2xl md:h-72 md:w-72" />
      <svg viewBox="0 0 520 360" className="relative h-full w-full drop-shadow-[0_0_42px_rgba(250,204,21,0.38)]">
        <defs>
          <radialGradient id="irisGlow" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#fff7ad" />
            <stop offset="42%" stopColor="#facc15" />
            <stop offset="74%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <linearGradient id="goldStroke" x1="54" y1="164" x2="463" y2="164" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef3c7" />
            <stop offset="0.32" stopColor="#fbbf24" />
            <stop offset="0.68" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="wingGradient" x1="64" y1="96" x2="472" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="0.35" stopColor="#fef08a" />
            <stop offset="0.7" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.4" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M60 174C118 96 190 61 279 74c74 11 126 58 181 94-60-14-105-8-148 13-57 28-104 48-168 28-33-10-58-23-84-35Z"
          fill="rgba(15,23,42,0.7)"
          stroke="url(#goldStroke)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#softGlow)"
        />
        <path
          d="M92 143c72-59 151-88 247-61 38 11 75 30 114 55-70-20-132-19-189 3-63 24-114 27-172 3Z"
          fill="url(#wingGradient)"
          opacity="0.72"
        />
        <ellipse cx="250" cy="163" rx="75" ry="64" fill="rgba(7,18,31,0.92)" stroke="#fef3c7" strokeWidth="4" />
        <circle cx="250" cy="163" r="48" fill="url(#irisGlow)" filter="url(#softGlow)" />
        <circle cx="250" cy="163" r="20" fill="#06111f" />
        <circle cx="236" cy="145" r="12" fill="#fff7ed" opacity="0.95" />
        <path d="M143 212c-8 36-24 64-54 84" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
        <path d="M204 226c-4 38-20 70-48 95" fill="none" stroke="#22d3ee" strokeWidth="7" strokeLinecap="round" opacity="0.86" />
        <path d="M250 232c21 34 55 51 104 49" fill="none" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round" opacity="0.82" />
        <path d="M78 116c92-77 220-105 366-20" fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" opacity="0.62" />
        <circle cx="388" cy="184" r="5" fill="#67e8f9" />
        <circle cx="417" cy="171" r="3" fill="#fde68a" />
        <circle cx="118" cy="174" r="4" fill="#fde68a" />
      </svg>
    </div>
  );
}

const productSteps = [
  {
    icon: Fingerprint,
    title: 'Registra lo importante',
    text: 'Guarda tu día, proyectos, relaciones y señales sin llenar formularios pesados.',
  },
  {
    icon: Network,
    title: 'Mira el sistema',
    text: 'El mapa conecta personas, proyectos y decisiones para que no dependas de la memoria.',
  },
  {
    icon: TimerReset,
    title: 'Compara cambios',
    text: 'Memory 4D te ayuda a ver qué cambió entre capturas y qué pide atención.',
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(250,204,21,0.16),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_58%_76%,rgba(34,211,238,0.16),transparent_34%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(125,211,252,0.45)_1px,transparent_1.4px)] [background-size:42px_42px] opacity-20" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cyan-300/10 to-transparent" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Observador 4D inicio">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/30 bg-slate-900/70 shadow-[0_0_28px_rgba(250,204,21,0.25)]">
            <Eye className="h-7 w-7 text-amber-200 transition-transform group-hover:scale-110" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.38em] text-slate-100">Observador 4D</span>
            <span className="block text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Ver más · vivir mejor</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <Link href="/tablero-3d" className="rounded-full border border-cyan-200/20 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/10">
            Explorar mapa
          </Link>
          <Link href="/auth/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            Entrar
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl items-center gap-10 px-5 pb-12 pt-4 md:grid-cols-[1fr_0.92fr] md:px-8 md:pb-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-sm text-amber-100 shadow-[0_0_24px_rgba(250,204,21,0.12)]">
            <Sparkles className="h-4 w-4" />
            Una entrada visual para observar antes de decidir
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
            Abre tu mapa.
            <span className="block bg-gradient-to-r from-amber-200 via-yellow-400 to-cyan-300 bg-clip-text text-transparent">
              Observa el sistema.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Observador 4D convierte proyectos, relaciones, registros diarios y cambios en una constelación clara. Entra para explorar qué está activo, qué cambió y cuál es el siguiente movimiento con evidencia.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tablero-3d"
              className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-[0_18px_50px_rgba(250,204,21,0.25)] transition hover:scale-[1.01]"
            >
              Explorar el mapa
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 px-6 py-4 text-base font-semibold text-cyan-50 backdrop-blur transition hover:bg-cyan-200/15"
            >
              Crear cuenta
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-semibold text-slate-100 backdrop-blur transition hover:bg-white/10"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Iniciar sesión
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-2xl font-bold text-amber-200">Mapa</p>
              <p className="mt-1 text-sm text-slate-400">Proyectos y relaciones visibles.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-2xl font-bold text-cyan-200">Memoria</p>
              <p className="mt-1 text-sm text-slate-400">Capturas para comparar evolución.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-2xl font-bold text-violet-200">Decisión</p>
              <p className="mt-1 text-sm text-slate-400">Señales antes de recomendar.</p>
            </div>
          </div>
        </div>

        <aside className="relative">
          <div className="absolute -inset-10 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl md:p-8">
            <div className="absolute right-5 top-5 rounded-full border border-cyan-200/25 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100/80">
              Portal 4D
            </div>
            <HorusEyeMark />
            <div className="grid gap-3 md:grid-cols-3">
              {productSteps.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <item.icon className="mb-3 h-5 w-5 text-amber-200" />
                  <h2 className="text-sm font-bold text-white">{item.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
