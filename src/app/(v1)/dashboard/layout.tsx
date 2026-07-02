import { getDashboardMetadata } from '@/lib/metadata';

export const metadata = getDashboardMetadata();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
