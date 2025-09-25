"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

interface SignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function SignOutButton({
  children = "Sign Out",
  className,
  variant = "outline",
  size = "md",
}: SignOutButtonProps) {
  return (
    <ClerkSignOutButton>
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </ClerkSignOutButton>
  );
}
