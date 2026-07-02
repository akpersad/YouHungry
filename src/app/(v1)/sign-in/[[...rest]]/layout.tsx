import { getSignInMetadata } from '@/lib/metadata';

export const metadata = getSignInMetadata();

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
