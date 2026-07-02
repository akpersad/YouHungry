import { getFriendsMetadata } from '@/lib/metadata';

export const metadata = getFriendsMetadata();

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
