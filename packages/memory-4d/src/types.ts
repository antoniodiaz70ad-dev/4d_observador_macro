export type Memory4DSchemaVersion = 1;

export type EntityType =
  | 'observer'
  | 'project'
  | 'relationship'
  | 'intention'
  | 'manifestation'
  | 'decision'
  | 'thought'
  | 'whiteboard-node'
  | 'custom';

export type StateProvenance = 'registered' | 'inferred' | 'scenario';
export type AbsenceReason = 'not_loaded' | 'absent' | 'deleted' | 'incompatible' | 'unauthorized';
export type TemporalBound = string | null | 'unknown';
export type QueryMode = 'currentKnowledgeAboutPast' | 'availableThen';

export interface SourceRef {
  platform: 'observador' | 'quantum-whiteboard' | 'second-brain' | 'demo' | string;
  resourceType: string;
  resourceId: string;
  versionId?: string;
}

export interface EntityRef {
  id: string;
  origin: string;
  type: EntityType;
  label: string;
  source: SourceRef;
}

export interface EvidenceRef {
  id: string;
  type: 'record' | 'snapshot' | 'decision' | 'document' | 'spatial' | 'demo';
  source: SourceRef;
  recordedAt?: string | null;
  occurredAt?: string | null;
  provenance: StateProvenance;
  note?: string;
  license?: string;
}

export interface SpatialEvidence {
  id: string;
  evidenceId: string;
  coordinateFrame: 'board-layout' | 'physical' | 'estimated';
  location: { x: number; y: number; z?: number };
  reconstructionMethod: string;
  methodVersion: string;
  validationLimit?: string;
  errorEstimate?: string;
  originalRef?: SourceRef;
  derivedRef?: SourceRef;
}

export interface MetricValue {
  value: number | null;
  unit: string;
  meaning: string;
}

export interface TemporalRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  kind: string;
  validFrom: TemporalBound;
  validTo: TemporalBound;
  recordedAt: string;
  version: number;
  evidenceIds: string[];
  provenance: StateProvenance;
}

export interface MemoryState {
  id: string;
  entity: EntityRef;
  schemaVersion: Memory4DSchemaVersion;
  occurredAt: string | null;
  recordedAt: string;
  capturedAt?: string;
  validFrom?: TemporalBound;
  validTo?: TemporalBound;
  attributes: Record<string, unknown>;
  metrics: Record<string, MetricValue>;
  relations: TemporalRelation[];
  evidenceIds: string[];
  provenance: StateProvenance;
  replacesStateId?: string;
}

export interface DecisionExpectation {
  id: string;
  description: string;
  horizon: string | null;
  metric?: MetricValue;
  contradictionCriteria: string;
  recordedAt: string;
}

export interface DecisionOutcome {
  id: string;
  recordedAt: string;
  occurredAt: string | null;
  description: string;
  evidenceIds: string[];
}

export interface DecisionMemory {
  id: string;
  entity: EntityRef;
  title: string;
  authorizedAuthor: string;
  decidedAt: string;
  context: string;
  chosenAlternative: string;
  alternatives: string[];
  assumptions: { claim: string; evidenceIds: string[] }[];
  expectations: DecisionExpectation[];
  outcomes: DecisionOutcome[];
  evaluation: 'pending' | 'supported' | 'contradicted' | 'inconclusive';
  retrospectiveExpectation: boolean;
}

export interface TimelineRecord {
  state: MemoryState;
  knowledgeStart: string;
  knowledgeEnd?: string | null;
}

export interface MemorySnapshot {
  id: string;
  schemaVersion: Memory4DSchemaVersion;
  label: string;
  capturedAt: string;
  ownerId: string;
  records: TimelineRecord[];
  evidences: EvidenceRef[];
  spatialEvidences: SpatialEvidence[];
  decisions: DecisionMemory[];
  sourceSummary: {
    host: string;
    coverage: string;
    limits: string[];
  };
}

export interface EntityFrame {
  entityId: string;
  state: MemoryState | null;
  snapshotId: string;
  capturedAt: string;
  absence?: AbsenceReason;
  criterion: 'exact-interval' | 'latest-before-query';
}

export interface TrailPoint {
  snapshotId: string;
  capturedAt: string;
  state: MemoryState | null;
  absence?: AbsenceReason;
  x: number;
  y: number | null;
}

export interface ComparisonChange {
  entityId: string;
  label: string;
  fields: string[];
  before?: MemoryState;
  after?: MemoryState;
  relationChanges: string[];
}
