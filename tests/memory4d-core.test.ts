import assert from 'node:assert/strict';
import { buildTrail, compareStates, createPlaybackClock, queryAt, temporalCut } from '../packages/memory-4d/src';
import { demoSnapshots } from '../packages/memory-4d/src/demo';

const [jan12, jan16, jan21] = demoSnapshots;
const projectId = 'demo:project:solar';
const partnerId = 'demo:relationship:ana';

assert.equal(jan12.records.length, 2);
assert.equal(jan16.records.some(record => record.state.entity.id === projectId), false);
assert.equal(jan21.records.some(record => record.state.replacesStateId === 'state:solar:jan10:v1'), true);

const trail = buildTrail(demoSnapshots, projectId);
assert.equal(trail.length, 3);
assert.equal(trail[1].state, null);
assert.equal(trail[1].absence, 'absent');
assert.equal(trail[0].y, 0.42);
assert.equal(trail[2].y, 0.72);

const changes = compareStates(jan12.records.map(record => record.state), jan21.records.map(record => record.state));
assert.ok(changes.some(change => change.entityId === projectId && change.fields.includes('attributes')));

const allRecords = demoSnapshots.flatMap(snapshot => snapshot.records);
const knowledge11 = queryAt({
  records: allRecords,
  entityId: projectId,
  eventTime: '2026-01-10T12:00:00.000Z',
  knowledgeTime: '2026-01-11T12:00:00.000Z',
  mode: 'currentKnowledgeAboutPast',
});
assert.equal(knowledge11.size, 0);

const knowledge15 = queryAt({
  records: allRecords,
  entityId: projectId,
  eventTime: '2026-01-10T12:00:00.000Z',
  knowledgeTime: '2026-01-15T12:00:00.000Z',
  mode: 'currentKnowledgeAboutPast',
});
assert.equal(knowledge15.get(projectId)?.id, 'state:solar:jan10:v1');

const knowledge21 = queryAt({
  records: allRecords,
  entityId: projectId,
  eventTime: '2026-01-10T12:00:00.000Z',
  knowledgeTime: '2026-01-21T12:00:00.000Z',
  mode: 'currentKnowledgeAboutPast',
});
assert.equal(knowledge21.get(projectId)?.id, 'state:solar:jan10:v2');

const availableThen = queryAt({
  records: allRecords,
  entityId: projectId,
  eventTime: '2026-01-10T12:00:00.000Z',
  knowledgeTime: '2026-01-21T12:00:00.000Z',
  mode: 'availableThen',
});
assert.equal(availableThen.size, 0);

const cut = temporalCut({ snapshots: demoSnapshots, entityIds: [projectId, partnerId], queryTime: '2026-01-16T10:00:00.000Z' });
assert.equal(cut.length, 2);
assert.equal(cut.find(frame => frame.entityId === projectId)?.criterion, 'latest-before-query');

const clock = createPlaybackClock(demoSnapshots);
assert.deepEqual(clock.state(), { index: 0, playing: false, atEnd: false });
clock.play();
clock.step(1);
clock.step(1);
assert.deepEqual(clock.state(), { index: 2, playing: false, atEnd: true });

assert.equal(demoSnapshots[2].decisions[0].expectations[0].recordedAt, '2026-01-12T09:30:00.000Z');
assert.equal(demoSnapshots[2].decisions[0].retrospectiveExpectation, false);

console.log('Memory 4D core tests passed.');
