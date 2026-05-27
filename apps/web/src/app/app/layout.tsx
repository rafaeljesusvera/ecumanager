import { ensureSession } from '@/lib/db';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureSession();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar session={session} />
      <main className="flex-1 overflow-x-hidden">
        <Topbar profileId={session.user.id} />
        {children}
      </main>
    </div>
  );
}
