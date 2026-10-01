export * from './types';

import type {
  AbsenceReason,
  ComparisonChange,
  EntityFrame,
  MemorySnapshot,
  MemoryState,
  QueryMode,
  TimelineRecord,
  TrailPoint,
} from './types';

export function normalizeInstant(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw new Error(`Invalid ISO date: ${value}`);
  return new Date(time).toISOString();
}

export function compareTemporal(a: string, b: string, aTie = '', bTie = '') {
  const diff = Date.parse(normalizeInstant(a)) - Date.parse(normalizeInstant(b));
  return diff || aTie.localeCompare(bTie);
}

export function sortRecords(records: TimelineRecord[]) {
  return [...records].sort((a, b) => {
    const byEvent = compareTemporal(
      a.state.occurredAt ?? a.state.recordedAt,
      b.state.occurredAt ?? b.state.recordedAt,
      a.state.id,
      b.state.id,
    );
    return byEvent || compareTemporal(a.knowledgeStart, b.knowledgeStart, a.state.id, b.state.id);
  });
}

function isKnownAt(record: TimelineRecord, knowledgeTime: string) {
  const t = Date.parse(normalizeInstant(knowledgeTime));
  const start = Date.parse(normalizeInstant(record.knowledgeStart));
  const end = record.knowledgeEnd ? Date.parse(normalizeInstant(record.knowledgeEnd)) : Number.POSITIVE_INFINITY;
  return start <= t && t < end;
}

function eventTimeFor(record: TimelineRecord) {
  return Date.parse(normalizeInstant(record.state.occurredAt ?? record.state.recordedAt));
}

export function queryAt(input: {
  records: TimelineRecord[];
  entityId?: string;
  eventTime: string;
  knowledgeTime: string;
  mode: QueryMode;
}) {
  const event = Date.parse(normalizeInstant(input.eventTime));
  const knowledgeTime =
    input.mode === 'availableThen' && compareTemporal(input.knowledgeTime, input.eventTime) > 0
      ? input.eventTime
      : input.knowledgeTime;

  return sortRecords(input.records)
    .filter(record => !input.entityId || record.state.entity.id === input.entityId)
    .filter(record => eventTimeFor(record) <= event)
    .filter(record => isKnownAt(record, knowledgeTime))
    .reduce<Map<string, MemoryState>>((map, record) => {
      map.set(record.state.entity.id, record.state);
      return map;
    }, new Map());
}

export function temporalCut(input: {
  snapshots: MemorySnapshot[];
  entityIds: string[];
  queryTime: string;
  maxStalenessMs?: number;
}): EntityFrame[] {
  const q = Date.parse(normalizeInstant(input.queryTime));
  return input.entityIds.map(entityId => {
    const candidates = input.snapshots
      .flatMap(snapshot =>
        snapshot.records.map(record => ({ snapshot, record })),
      )
      .filter(({ record }) => record.state.entity.id === entityId)
      .filter(({ record }) => {
        const from = record.state.validFrom === 'unknown' ? null : record.state.validFrom;
        const to = record.state.validTo === 'unknown' ? null : record.state.validTo;
        if (from && Date.parse(normalizeInstant(from)) <= q && (!to || q <= Date.parse(normalizeInstant(to)))) return true;
        return eventTimeFor(record) <= q;
      })
      .sort((a, b) => eventTimeFor(b.record) - eventTimeFor(a.record) || b.snapshot.id.localeCompare(a.snapshot.id));

    const found = candidates[0];
    if (!found) return { entityId, state: null, snapshotId: '', capturedAt: input.queryTime, absence: 'not_loaded' as AbsenceReason, criterion: 'latest-before-query' as const };

    const age = q - eventTimeFor(found.record);
    if (input.maxStalenessMs !== undefined && age > input.maxStalenessMs) {
      return { entityId, state: null, snapshotId: found.snapshot.id, capturedAt: found.snapshot.capturedAt, absence: 'absent', criterion: 'latest-before-query' };
    }

    const exact = found.record.state.validFrom && found.record.state.validFrom !== 'unknown';
    return {
      entityId,
      state: found.record.state,
      snapshotId: found.snapshot.id,
      capturedAt: found.snapshot.capturedAt,
      criterion: exact ? 'exact-interval' : 'latest-before-query',
    };
  });
}

export function buildTrail(snapshots: MemorySnapshot[], entityId: string, metricName = 'energy'): TrailPoint[] {
  const ordered = [...snapshots].sort((a, b) => compareTemporal(a.capturedAt, b.capturedAt, a.id, b.id));
  const times = ordered.map(snapshot => Date.parse(normalizeInstant(snapshot.capturedAt)));
  const min = Math.min(...times);
  const max = Math.max(...times);
  return ordered.map(snapshot => {
    const record = snapshot.records.find(item => item.state.entity.id === entityId);
    const metric = record?.state.metrics[metricName];
    const value = typeof metric?.value === 'number' ? Math.max(0, Math.min(1, metric.value)) : null;
    return {
      snapshotId: snapshot.id,
      capturedAt: snapshot.capturedAt,
      state: record?.state ?? null,
      absence: record ? undefined : 'absent',
      x: max > min ? (Date.parse(normalizeInstant(snapshot.capturedAt)) - min) / (max - min) : 0.5,
      y: value,
    };
  });
}

export function compareStates(before: MemoryState[], after: MemoryState[]): ComparisonChange[] {
  const oldMap = new Map(before.map(state => [state.entity.id, state]));
  const newMap = new Map(after.map(state => [state.entity.id, state]));
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);
  return [...ids].flatMap<ComparisonChange>(entityId => {
    const previous = oldMap.get(entityId);
    const next = newMap.get(entityId);
    const label = next?.entity.label ?? previous?.entity.label ?? entityId;
    if (!previous || !next) {
      return [{ entityId, label, fields: [previous ? 'absent-after' : 'added'], before: previous, after: next, relationChanges: [] }];
    }

    const fields = new Set<string>();
    if (previous.entity.label !== next.entity.label) fields.add('label');
    if (JSON.stringify(previous.attributes) !== JSON.stringify(next.attributes)) fields.add('attributes');
    if (JSON.stringify(previous.metrics) !== JSON.stringify(next.metrics)) fields.add('metrics');
    if (previous.provenance !== next.provenance) fields.add('provenance');

    const relationChanges =
      JSON.stringify(previous.relations.map(r => [r.id, r.kind, r.validFrom, r.validTo]).sort()) ===
      JSON.stringify(next.relations.map(r => [r.id, r.kind, r.validFrom, r.validTo]).sort())
        ? []
        : ['relations'];

    return fields.size || relationChanges.length
      ? [{ entityId, label, fields: [...fields], before: previous, after: next, relationChanges }]
      : [];
  });
}

export function createPlaybackClock(frames: readonly { capturedAt: string }[]) {
  let index = 0;
  let playing = false;
  const max = Math.max(0, frames.length - 1);
  return {
    play() {
      playing = true;
      return index;
    },
    pause() {
      playing = false;
      return index;
    },
    step(delta: number) {
      index = Math.max(0, Math.min(max, index + delta));
      if (index === max) playing = false;
      return index;
    },
    seek(next: number) {
      index = Math.max(0, Math.min(max, next));
      return index;
    },
    state() {
      return { index, playing, atEnd: index === max };
    },
  };
}
