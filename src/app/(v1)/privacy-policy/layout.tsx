import { getPrivacyPolicyMetadata } from '@/lib/metadata';

export const metadata = getPrivacyPolicyMetadata();

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
