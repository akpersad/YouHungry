import { EmptyState, ButtonLink } from '@/components/v2/ui';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
      <EmptyState
        title="This path goes nowhere"
        body="The page you followed does not exist. The fork lane always does."
        action={<ButtonLink href="/">Start a Fork</ButtonLink>}
      />
    </main>
  );
}
