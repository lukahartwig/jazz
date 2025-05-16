import {
  AccountsType,
  SSOProviderType,
  useAuth,
} from "jazz-react-auth-betterauth";
import { useEffect, useId, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card.js";
import { SSOButton } from "./sso-button.js";

type ProvidersCardProps = {
  providers?: SSOProviderType[];
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
};

export const ProvidersCard = ({
  providers,
  setLoading,
  setError,
}: ProvidersCardProps) => {
  const auth = useAuth();
  const [accounts, setAccounts] = useState<AccountsType | undefined>(undefined);
  useEffect(() => {
    return auth.authClient.useSession.subscribe(() => {
      auth.authClient.listAccounts().then((x) => setAccounts(x));
    });
  }, [auth.authClient]);

  const linkedProviders =
    providers?.filter((x) => accounts?.data?.some((y) => y.provider === x)) ??
    [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Single Sign-On Providers</CardTitle>
        <CardDescription>
          Connect your account to an external authentication provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!providers?.length && "No SSO providers configured."}
        {providers?.map((x) => {
          return (
            <SSOButton
              key={useId()}
              operation={linkedProviders.includes(x) ? "unlink" : "link"}
              provider={x}
              setLoading={setLoading}
              setError={setError}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};
ProvidersCard.displayName = "ProvidersCard";
