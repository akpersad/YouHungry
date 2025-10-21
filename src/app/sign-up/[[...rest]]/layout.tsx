import { getSignUpMetadata } from '@/lib/metadata';

export const metadata = getSignUpMetadata();

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
