# Memory 4D

Memory 4D is implemented as a local package at `packages/memory-4d` plus a host adapter for Observador.

What is included:

- Framework-free TypeScript contracts for entities, states, evidence, spatial evidence, temporal relations, decisions, bitemporal queries, comparisons, temporal cuts, trails and playback.
- Observador adapter at `lib/memory4d/observador-adapter.ts`.
- Authenticated local API at `/api/memory-4d` and `/api/memory-4d/trajectory`.
- App screens at `/memoria-4d` and `/memoria-4d/demo`.
- Fictitious demo data with two entities, three moments, one gap, one interval relation, one late correction and one decision with expectation plus later outcome.
- Manual SQL for local/staging use at `prisma/manual/20261001_board_snapshot.sql`.

Run:

```bash
npm install
npm run memory4d:test
npm run memory4d:build
npx prisma generate
npm run dev
```

Open:

- `/memoria-4d` for authenticated Observador captures.
- `/memoria-4d/demo` for the backend-independent demo.

Package consumption example:

```bash
npm pack ./packages/memory-4d
npm install ../4d_observador_macro/observador-memory-4d-0.1.0.tgz
```

Integration status:

- Observador integration is implemented locally.
- Quantum Whiteboard / Second Brain was found only as product and data model documents in this environment, not as a runnable source repo. The shared package is ready for that host to consume once its real repository is provided.
- No production database migration, deployment, provider call or package publishing was performed.

Limits:

- Existing `NodeSnapshot` rows are not used to reconstruct historical states.
- A missing capture is not treated as deletion.
- Unknown metrics remain `null`; they are not converted to zero.
- Evidence authorization belongs to each host. The package stores evidence ids and source references, not credentials or private permanent links.
- Scenario and AI interfaces are contracts only; there are no autonomous writes or model calls.
