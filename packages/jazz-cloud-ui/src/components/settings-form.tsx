"use client";

import { SSOProviderType } from "jazz-react-auth-betterauth";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { cn } from "../lib/utils.js";
import { DeleteAccountButton } from "./ui/delete-account-button.js";
import { ProvidersCard } from "./ui/providers-card.js";

type SettingsFormProps = {
  providers?: SSOProviderType[];
  deleteAccountRedirectUrl?: string;
};

export function SettingsForm({
  className,
  providers,
  deleteAccountRedirectUrl,
  ...props
}: React.ComponentProps<"div"> & SettingsFormProps) {
  const setLoading = useState(false)[1];
  const [error, setError] = useState<Error | undefined>(undefined);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <ProvidersCard
                  providers={providers}
                  setLoading={setLoading}
                  setError={setError}
                />
                <DeleteAccountButton
                  redirectUrl={deleteAccountRedirectUrl}
                  setLoading={setLoading}
                  setError={setError}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
