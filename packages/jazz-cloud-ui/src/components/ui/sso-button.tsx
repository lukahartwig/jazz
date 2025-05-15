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
  link?: boolean;
  callbackURL?: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
}

export const SSOButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ provider, link = false, callbackURL, setLoading, setError }) => {
    const auth = useAuth();
    const providerName = socialProviderNames[provider];
    const providerIcon = ssoIcons[provider];
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await (async () => {
            if (link) {
              return await auth.authClient.linkSocial({
                provider: provider,
              });
            } else {
              return await auth.authClient.signIn.social({
                provider: provider,
                callbackURL: callbackURL,
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
        {link
          ? `Link ${providerName} account`
          : `Continue with ${providerName}`}
      </Button>
    );
  },
);
SSOButton.displayName = "SSOButton";
