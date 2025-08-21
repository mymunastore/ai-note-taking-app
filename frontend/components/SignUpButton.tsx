import React from "react";
import { SignUpButton as ClerkSignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface SignUpButtonProps {
  mode?: "modal" | "redirect";
  children?: React.ReactNode;
}

export default function SignUpButton({ mode = "modal", children }: SignUpButtonProps) {
  return (
    <ClerkSignUpButton mode={mode}>
      {children || (
        <Button variant="outline" className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20">
          <UserPlus className="w-4 h-4 mr-2" />
          Sign Up
        </Button>
      )}
    </ClerkSignUpButton>
  );
}
