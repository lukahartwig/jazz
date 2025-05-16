import { FullAuthClient, useAuth } from "jazz-react-auth-betterauth";
import { RectangleEllipsis } from "lucide-react";
import { forwardRef } from "react";
import { Button } from "../../components/ui/button.js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  operation: "sign-up" | "sign-in" | "verify" | "reset";
  email: string;
  setOtpStatus: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>;
}

export const SendOtpButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ operation, email, setOtpStatus, setLoading, setError }) => {
    const auth = useAuth();
    const otpType =
      (() => {
        if (operation === "sign-up" || operation === "sign-in") {
          return "sign-in";
        } else if (operation === "verify") {
          return "email-verification";
        } else if (operation === "reset") {
          return "forget-password";
        }
      })() ?? "sign-in";
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { data, error } = await (
            auth.authClient as FullAuthClient
          ).emailOtp.sendVerificationOtp({
            email: email,
            type: otpType,
          });
          setOtpStatus(data?.success ?? false);
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
        <RectangleEllipsis />
        {(() => {
          if (operation === "sign-in") return "Sign in with one-time password";
          if (operation === "sign-up") return "Sign up with one-time password";
          if (operation === "verify")
            return "Verify account using one-time code";
          if (operation === "reset")
            return "Reset password using one-time code";
        })()}
      </Button>
    );
  },
);
SendOtpButton.displayName = "SendOtpButton";
