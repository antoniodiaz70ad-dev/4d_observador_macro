import type { DecisionMemory, EntityRef, EvidenceRef, MemorySnapshot, TimelineRecord } from './types';

const project: EntityRef = {
  id: 'demo:project:solar',
  origin: 'demo',
  type: 'project',
  label: 'Solar Ledger',
  source: { platform: 'demo', resourceType: 'project', resourceId: 'solar' },
};

const partner: EntityRef = {
  id: 'demo:relationship:ana',
  origin: 'demo',
  type: 'relationship',
  label: 'Ana Rivera',
  source: { platform: 'demo', resourceType: 'relationship', resourceId: 'ana' },
};

const decisionEntity: EntityRef = {
  id: 'demo:decision:pricing',
  origin: 'demo',
  type: 'decision',
  label: 'Decision de precio piloto',
  source: { platform: 'demo', resourceType: 'decision', resourceId: 'pricing' },
};

const evidences: EvidenceRef[] = [
  {
    id: 'evidence:brief-jan10',
    type: 'demo',
    source: { platform: 'demo', resourceType: 'note', resourceId: 'brief-jan10' },
    occurredAt: '2026-01-10T10:00:00.000Z',
    recordedAt: '2026-01-12T09:00:00.000Z',
    provenance: 'registered',
    note: 'Nota ficticia: expectativa registrada antes del resultado.',
  },
  {
    id: 'evidence:outcome-jan28',
    type: 'demo',
    source: { platform: 'demo', resourceType: 'note', resourceId: 'outcome-jan28' },
    occurredAt: '2026-01-28T18:00:00.000Z',
    recordedAt: '2026-01-29T09:00:00.000Z',
    provenance: 'registered',
    note: 'Resultado ficticio: dos clientes pidieron contrato anual.',
  },
];

function record(id: string, entity: EntityRef, value: number | null, capturedAt: string, recordedAt = capturedAt, replacesStateId?: string): TimelineRecord {
  return {
    knowledgeStart: recordedAt,
    state: {
      id,
      entity,
      schemaVersion: 1,
      occurredAt: capturedAt,
      recordedAt,
      capturedAt,
      attributes: { status: value === null ? 'unknown' : value > 0.65 ? 'strong' : 'forming' },
      metrics: { energy: { value, unit: 'ratio', meaning: 'Demo energy normalized from 0 to 1; null means unknown, not zero.' } },
      relations: [],
      evidenceIds: value === null ? [] : ['evidence:brief-jan10'],
      provenance: 'registered',
      replacesStateId,
    },
  };
}

const relation = {
  id: 'rel:solar-ana:pilot',
  fromEntityId: project.id,
  toEntityId: partner.id,
  kind: 'supports',
  validFrom: '2026-01-10T00:00:00.000Z',
  validTo: '2026-02-10T00:00:00.000Z',
  recordedAt: '2026-01-12T09:00:00.000Z',
  version: 1,
  evidenceIds: ['evidence:brief-jan10'],
  provenance: 'registered' as const,
};

const corrected = record('state:solar:jan10:v2', project, 0.72, '2026-01-10T10:00:00.000Z', '2026-01-20T08:00:00.000Z', 'state:solar:jan10:v1');
corrected.knowledgeEnd = null;
corrected.state.relations = [relation];
corrected.state.attributes = { status: 'strong', correction: 'Late correction recorded on Jan 20.' };

export const demoDecision: DecisionMemory = {
  id: 'decision:pricing',
  entity: decisionEntity,
  title: 'Subir precio del piloto',
  authorizedAuthor: 'Antonio Diaz',
  decidedAt: '2026-01-12T09:30:00.000Z',
  context: 'Se evaluo si el piloto debia venderse con descuento o con precio de validacion.',
  chosenAlternative: 'Precio de validacion anual',
  alternatives: ['Descuento de entrada', 'Piloto gratuito'],
  assumptions: [{ claim: 'El cliente que necesita trazabilidad pagara por evidencia historica.', evidenceIds: ['evidence:brief-jan10'] }],
  expectations: [
    {
      id: 'expectation:annual-interest',
      description: 'Al menos un cliente pedira contrato anual antes de fin de mes.',
      horizon: '2026-01-31T23:59:59.000Z',
      metric: { value: 1, unit: 'cliente', meaning: 'Minimo esperado antes del cierre del mes.' },
      contradictionCriteria: 'Cero solicitudes anuales antes del 31 de enero.',
      recordedAt: '2026-01-12T09:30:00.000Z',
    },
  ],
  outcomes: [
    {
      id: 'outcome:annual-interest',
      recordedAt: '2026-01-29T09:00:00.000Z',
      occurredAt: '2026-01-28T18:00:00.000Z',
      description: 'Dos clientes pidieron contrato anual.',
      evidenceIds: ['evidence:outcome-jan28'],
    },
  ],
  evaluation: 'supported',
  retrospectiveExpectation: false,
};

export const demoSnapshots: MemorySnapshot[] = [
  {
    id: 'snapshot:jan12',
    schemaVersion: 1,
    label: 'Registro inicial',
    capturedAt: '2026-01-12T09:00:00.000Z',
    ownerId: 'demo-user',
    records: [record('state:solar:jan10:v1', project, 0.42, '2026-01-10T10:00:00.000Z', '2026-01-12T09:00:00.000Z'), record('state:ana:jan12', partner, 0.55, '2026-01-12T09:00:00.000Z')],
    evidences,
    spatialEvidences: [],
    decisions: [demoDecision],
    sourceSummary: { host: 'memory-4d demo', coverage: 'Two entities, three moments, one gap, one late correction.', limits: ['Fictitious data only.'] },
  },
  {
    id: 'snapshot:jan16-gap',
    schemaVersion: 1,
    label: 'Hueco de proyecto',
    capturedAt: '2026-01-16T09:00:00.000Z',
    ownerId: 'demo-user',
    records: [record('state:ana:jan16', partner, 0.62, '2026-01-16T09:00:00.000Z')],
    evidences,
    spatialEvidences: [],
    decisions: [demoDecision],
    sourceSummary: { host: 'memory-4d demo', coverage: 'Project intentionally absent to show trail discontinuity.', limits: ['Absence is explicit; not a deletion claim.'] },
  },
  {
    id: 'snapshot:jan21',
    schemaVersion: 1,
    label: 'Correccion tardia conocida',
    capturedAt: '2026-01-21T09:00:00.000Z',
    ownerId: 'demo-user',
    records: [corrected, record('state:ana:jan21', partner, 0.7, '2026-01-21T09:00:00.000Z')],
    evidences,
    spatialEvidences: [],
    decisions: [demoDecision],
    sourceSummary: { host: 'memory-4d demo', coverage: 'Correction to Jan 10 becomes known on Jan 20.', limits: ['Manual demo snapshots; no reconstruction.'] },
  },
];
