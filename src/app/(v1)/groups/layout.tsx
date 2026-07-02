import { getGroupsMetadata } from '@/lib/metadata';

export const metadata = getGroupsMetadata();

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
