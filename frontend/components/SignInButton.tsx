import React from "react";
import { SignInButton as ClerkSignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { isDemoMode } from "../config";

interface SignInButtonProps {
  mode?: "modal" | "redirect";
  children?: React.ReactNode;
}

export default function SignInButton({ mode = "modal", children }: SignInButtonProps) {
  if (isDemoMode) {
    return (
      <Button 
        onClick={() => window.location.href = "/dashboard"}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Try Demo
      </Button>
    );
  }

  return (
    <ClerkSignInButton mode={mode}>
      {children || (
        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      )}
    </ClerkSignInButton>
  );
}
