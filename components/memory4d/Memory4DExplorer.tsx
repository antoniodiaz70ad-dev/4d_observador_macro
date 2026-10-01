'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar, GitCompare, Pause, Play, Save, ShieldCheck } from 'lucide-react';
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-sm text-cyan-300 hover:text-cyan-100">
              Volver al dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Memory 4D</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              Capturas manuales, tiempo de evento, tiempo de conocimiento, evidencia y decisiones. El historial empieza cuando se captura.
            </p>
          </div>
          <Link href="/memoria-4d/demo" className="rounded border border-cyan-500/50 px-3 py-2 text-sm text-cyan-200">
            Demo ficticia
          </Link>
        </div>

        {!demo && (
          <section className="grid gap-3 border-y border-slate-800 py-4 md:grid-cols-[1fr_auto]">
            <label className="text-sm text-slate-300">
              Titulo de nueva captura
              <input
                value={label}
                onChange={event => setLabel(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                maxLength={120}
                placeholder="Antes de una decision importante"
              />
            </label>
            <button
              onClick={capture}
              disabled={!label.trim()}
              className="inline-flex items-center justify-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 md:self-end"
            >
              <Save className="h-4 w-4" />
              Guardar estado
            </button>
          </section>
        )}

        {error && <p className="rounded border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {message && <p className="rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        {!ordered.length && (
          <section className="border-y border-slate-800 py-10 text-slate-300">
            Todavia no hay capturas. Guarda el primer estado para empezar la memoria temporal.
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
                      <dt className="text-slate-400">{key}</dt>
                      <dd>{String(value ?? 'desconocido')}</dd>
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
