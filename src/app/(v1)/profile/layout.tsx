import { getProfileMetadata } from '@/lib/metadata';

export const metadata = getProfileMetadata();

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
