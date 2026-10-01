# Memory 4D

Framework-free TypeScript core for temporal memory. It stores entity states with event time, knowledge time, evidence references, temporal relations, decision expectations and later outcomes.

```bash
npm install
npm run memory4d:test
npm run memory4d:build
npm pack ./packages/memory-4d
```

Local consumption from another project:

```bash
npm install ../4d_observador_macro/packages/memory-4d
```

The package does not include Prisma, React, Babylon, AI providers, credentials or persistence. Hosts provide storage, pagination, authentication and evidence authorization.
