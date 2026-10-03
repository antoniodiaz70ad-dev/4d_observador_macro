'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, Box, Brain, Calendar, Database, Eye, GitCompare, Loader2, Orbit, Pause, Play, Save, ShieldCheck, Sparkles, Target } from 'lucide-react';
import {
  buildTrail,
  compareStates,
  createPlaybackClock,
  queryAt,
  temporalCut,
  type MemorySnapshot,
  type MemoryState,
  type TrailPoint,
} from '@/packages/memory-4d/src';

type SnapshotRow = {
  id: string;
  label: string;
  capturedAt: string;
  schemaVersion: number;
  payload: MemorySnapshot;
};

type Memory4DAnalysis = {
  reading: string;
  tensions: string[];
  trajectory: string;
  nextDecision: string;
  confidence: number;
  model: string;
  source: 'gemini' | 'local-fallback';
};

function dateText(value: string | Date) {
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

function rowsFromSnapshots(snapshots: MemorySnapshot[]): SnapshotRow[] {
  return snapshots.map(snapshot => ({
    id: snapshot.id,
    label: snapshot.label,
    capturedAt: snapshot.capturedAt,
    schemaVersion: snapshot.schemaVersion,
    payload: snapshot,
  }));
}

function metricText(state: MemoryState | null | undefined) {
  const value = state?.metrics.energy?.value;
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'desconocido';
}


const attributeLabel = (key: string) => ({
  status: 'Estado',
  category: 'Categoría',
  progress: 'Progreso',
  energyInvested: 'Energía invertida',
  impactLevel: 'Impacto',
  metricRecorded: 'Métrica registrada',
  coherence: 'Coherencia',
  source: 'Fuente',
  relationshipType: 'Tipo de relación',
  importance: 'Importancia',
  energyExchange: 'Intercambio de energía',
  stage: 'Etapa',
  timeframe: 'Horizonte temporal',
  frequency: 'Frecuencia',
  streak: 'Racha',
  fulfilled: 'Días cumplidos',
  expected: 'Días esperados',
  latestBeforeQuery: 'Último dato antes de la consulta',
  supported: 'Soportado por evidencia',
  attributes: 'Atributos',
  metrics: 'Métricas',
  relations: 'Relaciones',
}[key] || key.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/^./, char => char.toUpperCase()));

const attributeValue = (value: unknown) => {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return 'Sin dato';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
};

export function Memory4DExplorer({ initialSnapshots = [], demo = false }: { initialSnapshots?: MemorySnapshot[]; demo?: boolean }) {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>(rowsFromSnapshots(initialSnapshots));
  const [selectedId, setSelectedId] = useState(initialSnapshots[0]?.id ?? '');
  const [compareId, setCompareId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [label, setLabel] = useState('');
  const [speedMs, setSpeedMs] = useState(1400);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Memory4DAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const clockRef = useRef(createPlaybackClock(initialSnapshots));

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    fetch('/api/memory-4d', { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar Memory 4D.');
        const rows = data.snapshots as SnapshotRow[];
        setSnapshots(rows);
        setSelectedId(current => current || rows[0]?.id || '');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [demo]);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt) || a.id.localeCompare(b.id)),
    [snapshots],
  );
  const selected = ordered.find(snapshot => snapshot.id === selectedId) ?? ordered[0];
  const compareTo = ordered.find(snapshot => snapshot.id === compareId);
  const states = selected?.payload.records.map(record => record.state) ?? [];
  const entities = useMemo(() => {
    const map = new Map<string, MemoryState['entity']>();
    for (const snapshot of ordered) {
      for (const record of snapshot.payload.records) map.set(record.state.entity.id, record.state.entity);
    }
    return [...map.values()];
  }, [ordered]);
  const activeEntityId = entityId || entities[0]?.id || '';
  const activeState = states.find(state => state.entity.id === activeEntityId);
  const trail = selected ? buildTrail(ordered.map(row => row.payload), activeEntityId) : [];
  const comparison = compareTo && selected ? compareStates(compareTo.payload.records.map(r => r.state), selected.payload.records.map(r => r.state)) : [];
  const cut = selected
    ? temporalCut({ snapshots: ordered.map(row => row.payload), entityIds: entities.slice(0, 6).map(entity => entity.id), queryTime: selected.capturedAt })
    : [];
  const availableThen = selected
    ? [...queryAt({
        records: ordered.flatMap(row => row.payload.records),
        eventTime: selected.capturedAt,
        knowledgeTime: selected.capturedAt,
        mode: 'availableThen',
      }).values()]
    : [];
  const latestSnapshot = ordered[ordered.length - 1];
  const allStates = ordered.flatMap(row => row.payload.records.map(record => record.state));
  const energyValues = allStates
    .map(state => state.metrics.energy?.value)
    .filter((value): value is number => typeof value === 'number');
  const averageEnergy = energyValues.length
    ? Math.round((energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) * 100)
    : null;
  const decisionCount = ordered.reduce((sum, row) => sum + row.payload.decisions.length, 0);
  const activeEntityLabel = activeState?.entity.label || entities.find(entity => entity.id === activeEntityId)?.label || 'Sin entidad';

  useEffect(() => {
    clockRef.current = createPlaybackClock(ordered);
  }, [ordered]);

  useEffect(() => {
    if (!playing || ordered.length < 2) return;
    const handle = window.setInterval(() => {
      const currentIndex = ordered.findIndex(snapshot => snapshot.id === selectedId);
      const next = currentIndex < ordered.length - 1 ? currentIndex + 1 : ordered.length - 1;
      setSelectedId(ordered[next]?.id || selectedId);
      if (next === ordered.length - 1) setPlaying(false);
    }, speedMs);
    return () => window.clearInterval(handle);
  }, [ordered, playing, selectedId, speedMs]);

  async function analyzeSelected() {
    if (demo || !selected) return;
    setMessage('');
    setError('');
    setAnalyzing(true);
    try {
      const response = await fetch('/api/memory-4d/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: selected.id, entityId: activeEntityId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo analizar la captura.');
      setAnalysis(data.analysis as Memory4DAnalysis);
    } catch (err: any) {
      setError(err?.message || 'No se pudo analizar la captura.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function capture() {
    if (demo) return;
    setMessage('');
    setError('');
    const response = await fetch('/api/memory-4d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'No se pudo guardar la captura.');
      return;
    }
    const next = data.snapshot as SnapshotRow;
    setSnapshots(current => [next, ...current]);
    setSelectedId(next.id);
    setLabel('');
    setMessage('Captura guardada.');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.14),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(245,158,11,0.10),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-purple-950/40 p-6 shadow-2xl shadow-cyan-950/40 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-100">
                <Eye className="h-4 w-4" />
                Volver al dashboard
              </Link>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">
                <Database className="h-3.5 w-3.5" />
                Centro de memoria temporal
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Memory 4D
                <span className="block bg-gradient-to-r from-cyan-200 via-purple-200 to-amber-100 bg-clip-text text-2xl text-transparent md:text-4xl">
                  observa tiempo, evidencia y decisiones.
                </span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Capturas manuales, tiempo de evento, tiempo de conocimiento, evidencia y decisiones. El historial empieza cuando se captura y se puede leer como mapa 3D/4D.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {!demo && (
                  <Link href="/memoria-4d/demo" className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">
                    Ver demo ficticia
                  </Link>
                )}
                {demo && (
                  <Link href="/auth/login" className="rounded-xl border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-sm text-purple-100 hover:bg-purple-500/20">
                    Entrar con mi cuenta
                  </Link>
                )}
                <Link href="/tablero-3d" className="rounded-xl border border-slate-700 bg-black/30 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/60 hover:text-cyan-100">
                  Abrir tablero 3D
                </Link>
              </div>
            </div>

            <div className="grid content-start gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-cyan-400/20 bg-black/35 p-4 shadow-lg shadow-cyan-950/20">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                  <Database className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold text-white">{ordered.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">capturas</p>
              </article>
              <article className="rounded-2xl border border-purple-400/20 bg-black/35 p-4 shadow-lg shadow-purple-950/20">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-200">
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold text-white">{entities.length}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">entidades</p>
              </article>
              <article className="rounded-2xl border border-emerald-400/20 bg-black/35 p-4 shadow-lg shadow-emerald-950/20">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold text-white">{averageEnergy === null ? '—' : `${averageEnergy}%`}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">energía media</p>
              </article>
              <article className="rounded-2xl border border-amber-300/20 bg-black/35 p-4 shadow-lg shadow-amber-950/20">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold text-white">{decisionCount}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">decisiones</p>
              </article>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-purple-950/40 p-5 shadow-2xl shadow-cyan-950/30">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative grid gap-4 lg:grid-cols-[1.1fr_2fr]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Modo Biwal visual
              </div>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                Cambia de historial a campo visual.
              </h2>
              <p className="text-sm leading-6 text-slate-300">
                Memory 4D guarda el tiempo. Las vistas visuales muestran el campo: nodos, energía, coherencia, geometría Wolcoff y órbitas de proyectos.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Link href="/tablero-3d" className="group rounded-2xl border border-cyan-400/30 bg-black/35 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-950/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200 shadow-lg shadow-cyan-500/20">
                  <Box className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">Tablero 3D</h3>
                  <ArrowUpRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Mapa interactivo de nodos, relaciones, filtros y profundidad espacial.
                </p>
              </Link>

              <Link href="/wolcoff" className="group rounded-2xl border border-purple-400/30 bg-black/35 p-4 transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-950/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/15 text-purple-200 shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">Wolcoff 4D</h3>
                  <ArrowUpRight className="h-4 w-4 text-purple-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Geometría viva para coherencia, energía, fricción y expansión.
                </p>
              </Link>

              <Link href="/economy-view" className="group rounded-2xl border border-amber-300/30 bg-black/35 p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-950/20">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/15 text-amber-100 shadow-lg shadow-amber-500/20">
                  <Orbit className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">God View</h3>
                  <ArrowUpRight className="h-4 w-4 text-amber-200 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Sistema solar de proyectos, economía agéntica y decisiones.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {!demo && (
          <section className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-xl shadow-black/30 md:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="text-sm text-slate-300">
              <span className="flex items-center gap-2 text-cyan-200"><Save className="h-4 w-4" /> Nueva captura temporal</span>
              <input
                value={label}
                onChange={event => setLabel(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
                maxLength={120}
                placeholder="Antes de una decisión importante"
              />
            </label>
            <button
              onClick={capture}
              disabled={!label.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 disabled:cursor-not-allowed disabled:opacity-40 md:self-end"
            >
              <Save className="h-4 w-4" />
              Guardar estado
            </button>
            </div>
          </section>
        )}

        {error && <p className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}
        {message && <p className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{message}</p>}

        {!ordered.length && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center text-slate-300">
            <Database className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
            Todavía no hay capturas. Guarda el primer estado para empezar la memoria temporal.
          </section>
        )}

        {!!ordered.length && selected && (
          <>
            <section className="grid gap-4 border-y border-slate-800 py-4 lg:grid-cols-4">
              <label className="text-sm text-slate-300">
                Fecha
                <select value={selected.id} onChange={event => setSelectedId(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2">
                  {ordered.map(snapshot => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {dateText(snapshot.capturedAt)} · {snapshot.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Entidad
                <select value={activeEntityId} onChange={event => setEntityId(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2">
                  {entities.map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Comparar con
                <select value={compareId} onChange={event => setCompareId(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2">
                  <option value="">Sin comparacion</option>
                  {ordered.map(snapshot => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {dateText(snapshot.capturedAt)} · {snapshot.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Velocidad
                <input type="range" min={500} max={3000} step={100} value={speedMs} onChange={event => setSpeedMs(Number(event.target.value))} className="mt-3 w-full" />
              </label>
              <div className="flex items-center gap-2 lg:col-span-4">
                <button onClick={() => setPlaying(value => !value)} className="inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pausa' : 'Play'}
                </button>
                <input
                  aria-label="Recorrer capturas"
                  type="range"
                  min={0}
                  max={Math.max(0, ordered.length - 1)}
                  value={Math.max(0, ordered.findIndex(snapshot => snapshot.id === selected.id))}
                  onChange={event => setSelectedId(ordered[Number(event.target.value)]?.id || selected.id)}
                  className="min-w-0 flex-1"
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="min-h-[320px] border-y border-slate-800 py-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
                  <Calendar className="h-4 w-4" />
                  Estado temporal · {dateText(selected.capturedAt)}
                </div>
                <MemoryTrail trail={trail} selectedId={selected.id} onSelect={setSelectedId} />
              </div>

              <div className="border-y border-slate-800 py-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
                  <ShieldCheck className="h-4 w-4" />
                  Detalle y evidencia
                </div>
                <h2 className="text-xl font-medium">{activeState?.entity.label || entities.find(entity => entity.id === activeEntityId)?.label}</h2>
                <p className="mt-1 text-sm text-slate-300">Energia registrada: {metricText(activeState)}</p>
                <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(activeState?.attributes ?? {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[9rem_1fr] gap-2 border-b border-slate-800 py-1">
                      <dt className="text-slate-400">{attributeLabel(key)}</dt>
                      <dd>{attributeValue(value)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 space-y-2 text-sm">
                  {(activeState?.evidenceIds ?? []).map(id => {
                    const ev = selected.payload.evidences.find(item => item.id === id);
                    return (
                      <p key={id} className="rounded border border-slate-800 px-3 py-2 text-slate-300">
                        {ev?.note || id} · {ev?.recordedAt ? dateText(ev.recordedAt) : 'sin fecha'}
                      </p>
                    );
                  })}
                </div>
              </div>
            </section>

            {!demo && (
              <section className="border-y border-slate-800 py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm text-cyan-200">
                    <Brain className="h-4 w-4" />
                    Análisis IA de Memory 4D
                  </h2>
                  <button
                    onClick={analyzeSelected}
                    disabled={analyzing || !selected}
                    className="inline-flex items-center gap-2 rounded border border-purple-500/50 px-3 py-2 text-sm text-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {analyzing ? 'Analizando...' : 'Analizar captura'}
                  </button>
                </div>
                {!analysis && <p className="text-sm text-slate-400">Ejecuta el análisis para convertir la captura temporal en lectura, tensiones y siguiente decisión.</p>}
                {analysis && (
                  <div className="grid gap-3 text-sm lg:grid-cols-2">
                    <article className="rounded border border-slate-800 bg-slate-900/50 p-4 lg:col-span-2">
                      <p className="text-slate-200">{analysis.reading}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Modelo: {analysis.model} · confianza {Math.round(analysis.confidence * 100)}% · {analysis.source === 'gemini' ? 'Gemini' : 'fallback local'}
                      </p>
                    </article>
                    <article className="rounded border border-slate-800 bg-slate-900/50 p-4">
                      <h3 className="mb-2 font-medium text-purple-200">Tensiones</h3>
                      <ul className="space-y-2 text-slate-300">
                        {analysis.tensions.map((item, index) => (
                          <li key={`${item}-${index}`}>• {item}</li>
                        ))}
                      </ul>
                    </article>
                    <article className="rounded border border-slate-800 bg-slate-900/50 p-4">
                      <h3 className="mb-2 font-medium text-purple-200">Siguiente decisión</h3>
                      <p className="text-slate-300">{analysis.nextDecision}</p>
                    </article>
                    <article className="rounded border border-slate-800 bg-slate-900/50 p-4 lg:col-span-2">
                      <h3 className="mb-2 font-medium text-purple-200">Trayectoria</h3>
                      <p className="text-slate-300">{analysis.trajectory}</p>
                    </article>
                  </div>
                )}
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="border-y border-slate-800 py-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
                  <GitCompare className="h-4 w-4" />
                  Comparacion
                </h2>
                {!compareTo && <p className="text-sm text-slate-400">Elige otra captura para comparar.</p>}
                {comparison.map(change => (
                  <p key={change.entityId} className="border-b border-slate-800 py-2 text-sm">
                    {change.label}: {change.fields.concat(change.relationChanges).join(', ') || 'sin cambios'}
                  </p>
                ))}
              </div>

              <div className="border-y border-slate-800 py-4">
                <h2 className="mb-3 text-sm text-cyan-200">Corte temporal</h2>
                {cut.map(frame => (
                  <p key={frame.entityId} className="border-b border-slate-800 py-2 text-sm">
                    {entities.find(entity => entity.id === frame.entityId)?.label}: {frame.state ? metricText(frame.state) : frame.absence} · {frame.criterion}
                  </p>
                ))}
              </div>

              <div className="border-y border-slate-800 py-4">
                <h2 className="mb-3 text-sm text-cyan-200">Conocimiento disponible entonces</h2>
                <p className="text-sm text-slate-300">{availableThen.length} estados visibles segun el conocimiento registrado en esa fecha.</p>
                <p className="mt-2 text-xs text-slate-500">Las correcciones tardias aparecen solo desde su fecha de conocimiento.</p>
              </div>
            </section>

            <section className="border-y border-slate-800 py-4">
              <h2 className="mb-3 text-sm text-cyan-200">Decisiones</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {selected.payload.decisions.map(decision => (
                  <article key={decision.id} className="rounded border border-slate-800 p-4">
                    <h3 className="font-medium">{decision.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{decision.context}</p>
                    <p className="mt-2 text-sm">Supuesto: {decision.assumptions[0]?.claim || 'sin supuesto explicito'}</p>
                    <p className="mt-1 text-sm">Resultado: {decision.outcomes[0]?.description || 'pendiente'} · {decision.evaluation}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MemoryTrail({ trail, selectedId, onSelect }: { trail: TrailPoint[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="relative h-56 border border-slate-800 bg-slate-900/60">
        <div className="absolute inset-x-4 bottom-8 h-px bg-slate-700" />
        {trail.map(point => {
          const left = `${8 + point.x * 84}%`;
          const bottom = point.y === null ? '2rem' : `${2 + point.y * 10}rem`;
          return (
            <button
              key={point.snapshotId}
              onClick={() => onSelect(point.snapshotId)}
              className={`absolute h-5 w-5 -translate-x-1/2 rounded-full border ${point.snapshotId === selectedId ? 'border-cyan-200 bg-cyan-400' : point.state ? 'border-emerald-300 bg-emerald-500' : 'border-amber-300 bg-transparent'}`}
              style={{ left, bottom }}
              aria-label={`${dateText(point.capturedAt)} ${point.state ? metricText(point.state) : 'sin estado'}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {trail.map(point => (
          <button key={point.snapshotId} onClick={() => onSelect(point.snapshotId)} className="rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300">
            {dateText(point.capturedAt)}
            <br />
            {point.state ? metricText(point.state) : point.absence}
          </button>
        ))}
      </div>
    </div>
  );
}
