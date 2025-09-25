"use client";

import { UserButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/Card";

export function UserProfile() {
  return (
    <Card className="w-fit">
      <CardContent className="p-2">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
