import { useAccount } from "jazz-react";
import { useAuth } from "jazz-react-auth-betterauth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback } from "react";
import { Button } from "../../components/ui/button.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  redirectUrl?: string;
}

export const LogoutButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ redirectUrl }) => {
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
        variant="outline"
        className="w-full"
        onClick={signOut}
      >
        <LogOut />
        Sign out
      </Button>
    );
  },
);
LogoutButton.displayName = "LogoutButton";
