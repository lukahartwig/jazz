import { SSOProviderType, useAuth } from "jazz-react-auth-betterauth";
import { socialProviderNames } from "jazz-react-auth-betterauth";
import { forwardRef } from "react";
import { Button } from "../../components/ui/button.js";
import { ssoIcons } from "../../lib/sso.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  src?: InstanceType<typeof Image>["src"];
  alt?: InstanceType<typeof Image>["alt"];
  provider: SSOProviderType;
  operation: "sign-in" | "sign-up" | "link" | "unlink";
  accountId?: string;
  callbackURL?: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
}

export const SSOButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ provider, operation, accountId, callbackURL, setLoading, setError }) => {
    const auth = useAuth();
    const providerName = socialProviderNames[provider];
    const providerIcon = ssoIcons[provider];
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await (async () => {
            if (operation === "link") {
              return await auth.authClient.linkSocial({
                provider: provider,
              });
            } else if (operation === "sign-in" || operation === "sign-up") {
              return await auth.authClient.signIn.social({
                provider: provider,
                callbackURL: callbackURL,
              });
            } else {
              return await auth.authClient.unlinkAccount({
                providerId: provider,
                accountId: accountId,
              });
            }
          })();
          if (error) {
            setError({
              ...error,
              name: error.message ?? error.statusText,
              message: error.message ?? error.statusText,
            });
          }
          setLoading(false);
        }}
      >
        {providerIcon}
        {(() => {
          if (operation === "sign-in") return `Login with ${providerName}`;
          if (operation === "sign-up") return `Register with ${providerName}`;
          if (operation === "link") return "Link";
          if (operation === "unlink") return "Unlink";
        })()}
      </Button>
    );
  },
);
SSOButton.displayName = "SSOButton";
