import { useAccount } from "jazz-react";
import { useAuth } from "jazz-react-auth-betterauth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback } from "react";
import { Button } from "../../components/ui/button.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  redirectUrl?: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
}

export const DeleteAccountButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ redirectUrl, setLoading, setError }) => {
    const { logOut } = useAccount();
    const auth = useAuth();
    const router = useRouter();
    const signOut = useCallback(() => {
      auth.authClient
        .signOut()
        .catch(console.error)
        .finally(() => {
          logOut();
          if (redirectUrl) router.push(redirectUrl);
        });
    }, [logOut, router, auth.authClient]);

    return (
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await auth.authClient.deleteUser(
            {
              callbackURL: undefined,
            },
            {
              onSuccess: () => {
                signOut();
              },
            },
          );
          const errorMessage = error?.message ?? error?.statusText;
          setError(
            error
              ? {
                  ...error,
                  name: error.statusText,
                  message:
                    errorMessage && errorMessage.length > 0
                      ? errorMessage
                      : "An error occurred",
                }
              : undefined,
          );
          setLoading(false);
        }}
      >
        Delete account
      </Button>
    );
  },
);
DeleteAccountButton.displayName = "DeleteAccountButton";
