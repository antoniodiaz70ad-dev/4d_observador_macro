import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Memory4DExplorer } from '@/components/memory4d/Memory4DExplorer';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Memory4DPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');
  return <Memory4DExplorer />;
}
