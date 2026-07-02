import { BetaHeader } from '@/components/v2/BetaHeader';

// Every /beta page shares the quiet shell; pages own their own <main>.
export default function BetaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BetaHeader />
      {children}
    </div>
  );
}
