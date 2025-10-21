import { getHistoryMetadata } from '@/lib/metadata';

export const metadata = getHistoryMetadata();

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
