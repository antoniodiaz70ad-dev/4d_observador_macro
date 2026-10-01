import { Memory4DExplorer } from '@/components/memory4d/Memory4DExplorer';
import { demoSnapshots } from '@/packages/memory-4d/src/demo';

export const dynamic = 'force-static';

export default function Memory4DDemoPage() {
  return <Memory4DExplorer initialSnapshots={demoSnapshots} demo />;
}
