'use client';

import { UserButton } from '@clerk/nextjs';

export function UserProfile() {
  return (
    <div className="inline-flex items-center justify-center">
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: 'w-10 h-10',
            userButtonTrigger:
              'focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95',
          },
          variables: {
            colorPrimary: 'var(--accent-primary)',
          },
        }}
      />
    </div>
  );
}
