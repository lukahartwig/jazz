import { FullAuthClient, useAuth } from "jazz-react-auth-betterauth";
import { Link } from "lucide-react";
import { forwardRef } from "react";
import { Button } from "../../components/ui/button.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  operation: "sign-up" | "sign-in";
  email: string;
  callbackURL?: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
}

export const MagicLinkButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ operation, email, callbackURL, setLoading, setError }) => {
    const auth = useAuth();
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await (
            auth.authClient as FullAuthClient
          ).signIn.magicLink({
            email: email,
            callbackURL: callbackURL,
          });
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
        <Link />
        {operation === "sign-in"
          ? "Sign in with magic link"
          : "Sign up with magic link"}
      </Button>
    );
  },
);
MagicLinkButton.displayName = "MagicLinkButton";
