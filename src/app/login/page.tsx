"use client";

import { useActionState } from "react";

import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <TextField id="email" label="Email" name="email" required type="email" />
        <TextField id="password" label="Password" name="password" required type="password" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
