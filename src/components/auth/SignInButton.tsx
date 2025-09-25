"use client";

import { SignInButton as ClerkSignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

interface SignInButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function SignInButton({
  children = "Sign In",
  className,
  variant = "primary",
  size = "md",
}: SignInButtonProps) {
  return (
    <ClerkSignInButton mode="modal">
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </ClerkSignInButton>
  );
}
