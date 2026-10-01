import type { DecisionMemory, EntityRef, EvidenceRef, MemorySnapshot, MemoryState, TimelineRecord } from '@/packages/memory-4d/src';

type AnyRecord = Record<string, any>;

const iso = (value: string | Date | null | undefined, fallback = new Date()) =>
  value ? new Date(value).toISOString() : fallback.toISOString();

function entity(origin: string, type: EntityRef['type'], id: string, label: string, resourceType: string = type): EntityRef {
  return {
    id: `${origin}:${type}:${id}`,
    origin,
    type,
    label,
    source: { platform: 'observador', resourceType, resourceId: id },
  };
}

function evidence(id: string, resourceType: string, recordedAt: string | Date | null | undefined, note: string): EvidenceRef {
  return {
    id: `observador:evidence:${resourceType}:${id}`,
    type: 'record',
    source: { platform: 'observador', resourceType, resourceId: id },
    recordedAt: iso(recordedAt),
    occurredAt: null,
    provenance: 'registered',
    note,
  };
}

function stateFor(input: {
  entity: EntityRef;
  capturedAt: string;
  recordedAt: string;
  attributes: Record<string, unknown>;
  energy: number | null;
  evidenceIds: string[];
  stateId: string;
}): TimelineRecord {
  return {
    knowledgeStart: input.recordedAt,
    state: {
      id: input.stateId,
      entity: input.entity,
      schemaVersion: 1,
      occurredAt: input.recordedAt,
      recordedAt: input.recordedAt,
      capturedAt: input.capturedAt,
      attributes: input.attributes,
      metrics: {
        energy: {
          value: input.energy,
          unit: 'ratio',
          meaning: 'Normalized Observador energy from current app fields; null means unknown, not zero.',
        },
      },
      relations: [],
      evidenceIds: input.evidenceIds,
      provenance: 'registered',
    },
  };
}

function clampRatio(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function buildObservadorMemorySnapshot(input: {
  ownerId: string;
  label: string;
  capturedAt?: Date;
  user: AnyRecord | null;
  projects: AnyRecord[];
  relationships: AnyRecord[];
  intentions: AnyRecord[];
  manifestations: AnyRecord[];
  metrics: AnyRecord | null;
  externalDecisions: AnyRecord[];
  agentDecisions: AnyRecord[];
}): MemorySnapshot {
  const capturedAt = iso(input.capturedAt);
  const records: TimelineRecord[] = [];
  const evidences: EvidenceRef[] = [];
  const decisions: DecisionMemory[] = [];

  const observer = entity('observador', 'observer', input.ownerId, input.user?.name || 'Observador 4D', 'user');
  const observerEvidence = evidence(input.ownerId, 'userMetrics', input.metrics?.date ?? input.metrics?.updatedAt ?? input.metrics?.createdAt, 'Latest user metrics available at capture time.');
  evidences.push(observerEvidence);
  records.push(
    stateFor({
      entity: observer,
      capturedAt,
      recordedAt: iso(input.metrics?.date ?? input.metrics?.updatedAt ?? capturedAt),
      attributes: {
        email: input.user?.email ?? null,
        metricRecorded: Boolean(input.metrics),
        coherence: input.metrics?.overallCoherence ?? null,
      },
      energy: clampRatio((input.metrics?.overallCoherence ?? null) / 100),
      evidenceIds: [observerEvidence.id],
      stateId: `observador:state:observer:${input.ownerId}:${capturedAt}`,
    }),
  );

  for (const project of input.projects) {
    const item = entity('observador', 'project', project.id, project.name);
    const ev = evidence(project.id, 'project', project.updatedAt ?? project.createdAt, 'Project record captured manually by Memory 4D.');
    evidences.push(ev);
    records.push(
      stateFor({
        entity: item,
        capturedAt,
        recordedAt: iso(project.updatedAt ?? project.createdAt ?? capturedAt),
        attributes: {
          status: project.status,
          category: project.category ?? null,
          progress: project.progress ?? null,
          description: project.description ?? null,
        },
        energy: clampRatio(((project.progress ?? 0) / 100 + (project.energyInvested ?? 0) / 10) / 2),
        evidenceIds: [ev.id],
        stateId: `observador:state:project:${project.id}:${capturedAt}`,
      }),
    );
  }

  for (const relationship of input.relationships) {
    const item = entity('observador', 'relationship', relationship.id, relationship.name);
    const ev = evidence(relationship.id, 'relationship', relationship.updatedAt ?? relationship.createdAt, 'Relationship record captured manually by Memory 4D.');
    evidences.push(ev);
    records.push(
      stateFor({
        entity: item,
        capturedAt,
        recordedAt: iso(relationship.updatedAt ?? relationship.createdAt ?? capturedAt),
        attributes: {
          relationshipType: relationship.relationshipType ?? null,
          importance: relationship.importance ?? null,
          energyExchange: relationship.energyExchange ?? null,
        },
        energy: clampRatio((relationship.connectionQuality ?? null) / 10),
        evidenceIds: [ev.id],
        stateId: `observador:state:relationship:${relationship.id}:${capturedAt}`,
      }),
    );
  }

  for (const intention of input.intentions) {
    const item = entity('observador', 'intention', intention.id, intention.title);
    const ev = evidence(intention.id, 'intention', intention.updatedAt ?? intention.createdAt, 'Intention record captured manually by Memory 4D.');
    const rate = intention.totalExpectedDays ? intention.totalFulfilledDays / intention.totalExpectedDays : null;
    evidences.push(ev);
    records.push(
      stateFor({
        entity: item,
        capturedAt,
        recordedAt: iso(intention.updatedAt ?? intention.createdAt ?? capturedAt),
        attributes: {
          status: intention.status,
          category: intention.category,
          frequency: intention.frequency,
          currentStreak: intention.currentStreak,
        },
        energy: clampRatio(rate),
        evidenceIds: [ev.id],
        stateId: `observador:state:intention:${intention.id}:${capturedAt}`,
      }),
    );
  }

  for (const manifestation of input.manifestations) {
    const item = entity('observador', 'manifestation', manifestation.id, manifestation.title);
    const ev = evidence(manifestation.id, 'manifestation', manifestation.updatedAt ?? manifestation.createdAt, 'Manifestation record captured manually by Memory 4D.');
    evidences.push(ev);
    records.push(
      stateFor({
        entity: item,
        capturedAt,
        recordedAt: iso(manifestation.updatedAt ?? manifestation.createdAt ?? capturedAt),
        attributes: {
          status: manifestation.status,
          category: manifestation.category,
          stage: manifestation.manifestationStage ?? null,
          timeframe: manifestation.timeframe ?? null,
        },
        energy: clampRatio((manifestation.manifestationStage ?? null) / 100),
        evidenceIds: [ev.id],
        stateId: `observador:state:manifestation:${manifestation.id}:${capturedAt}`,
      }),
    );
  }

  for (const decision of [...input.externalDecisions, ...input.agentDecisions]) {
    const item = entity('observador', 'decision', decision.id, decision.actionLabel || decision.actionTaken || 'Decision');
    const ev = evidence(decision.id, 'decision', decision.timestamp ?? decision.createdAt, 'Decision record captured for later outcome review.');
    evidences.push(ev);
    decisions.push({
      id: `observador:decision:${decision.id}`,
      entity: item,
      title: decision.actionLabel || decision.actionTaken || 'Decision registrada',
      authorizedAuthor: decision.agentName || 'Observador',
      decidedAt: iso(decision.timestamp ?? decision.createdAt ?? capturedAt),
      context: decision.inputSummary || decision.contextType || 'Contexto no especificado',
      chosenAlternative: decision.actionTaken || 'Accion registrada',
      alternatives: [],
      assumptions: [{ claim: 'La decision se registro sin supuestos estructurados adicionales.', evidenceIds: [ev.id] }],
      expectations: [
        {
          id: `observador:expectation:${decision.id}`,
          description: decision.outcome ? `Resultado esperado o observado: ${decision.outcome}` : 'Sin expectativa explicita registrada.',
          horizon: null,
          contradictionCriteria: 'No hay criterio estructurado de contradiccion en el registro original.',
          recordedAt: iso(decision.timestamp ?? decision.createdAt ?? capturedAt),
        },
      ],
      outcomes: decision.outcome
        ? [
            {
              id: `observador:outcome:${decision.id}`,
              recordedAt: iso(decision.createdAt ?? decision.timestamp ?? capturedAt),
              occurredAt: iso(decision.timestamp ?? decision.createdAt ?? capturedAt),
              description: decision.outcome,
              evidenceIds: [ev.id],
            },
          ]
        : [],
      evaluation: decision.outcome ? 'inconclusive' : 'pending',
      retrospectiveExpectation: Boolean(decision.outcome),
    });
  }

  return {
    id: `observador:snapshot:${capturedAt}`,
    schemaVersion: 1,
    label: input.label,
    capturedAt,
    ownerId: input.ownerId,
    records,
    evidences,
    spatialEvidences: [],
    decisions,
    sourceSummary: {
      host: 'Observador 4D',
      coverage: 'Manual capture of current active Observador entities and recent decisions.',
      limits: [
        'Historical state begins at manual capture time.',
        'Legacy NodeSnapshot rows are not used to reconstruct missing history.',
        'Evidence authorization is enforced by the host route.',
      ],
    },
  };
}

export function toPublicSnapshot(value: unknown): MemorySnapshot {
  return value as MemorySnapshot;
}
