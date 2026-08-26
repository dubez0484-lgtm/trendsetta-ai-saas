import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4 sm:flex-row sm:p-6">
      <SidebarNav userName={session.user.name || session.user.email || 'Account'} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
