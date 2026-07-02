import { getAnalyticsMetadata } from '@/lib/metadata';

export const metadata = getAnalyticsMetadata();

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
