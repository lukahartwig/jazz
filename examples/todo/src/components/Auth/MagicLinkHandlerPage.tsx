import { Button } from "@/basicComponents/ui/button";
import { useHandleMagicLinkAuth } from "jazz-react";
import { useNavigate } from "react-router-dom";

export function MagicLinkHandlerPage() {
  return (
    <main className="container flex flex-col items-center gap-4 px-4 py-8 text-center">
      <h1 className="text-2xl font-bold">Get your device logged in</h1>
      <div className="flex flex-col items-center gap-4 p-6">
        <MagicLinkHandler />
      </div>
    </main>
  );
}

export function MagicLinkHandler() {
  const navigate = useNavigate();

  const { status, confirmationCode } = useHandleMagicLinkAuth({
    as: "source",
    sourceHandlerPath: "/#/magic-link-handler-source",
  });

  const handleBackToHome = () => {
    navigate("/");
  };

  if (status === "idle") {
    return <p>Loading...</p>;
  }

  if (status === "confirmationCodeGenerated") {
    return (
      <>
        <p>Enter this code on your other device</p>
        <p className="font-medium text-3xl tracking-widest text-center">
          {confirmationCode ?? "empty"}
        </p>
        <p className="text-red-500">Never share this code with anyone!</p>
      </>
    );
  }

  if (status === "authorized") {
    return (
      <>
        <p>Your device has been logged in! 🚀</p>
        <Button onClick={handleBackToHome} className="w-full">
          Back to home
        </Button>
      </>
    );
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>The confirmation code was incorrect - please try again</p>
        <Button onClick={handleBackToHome} className="w-full">
          Back to home
        </Button>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <p>Oops! Something went wrong</p>
        <Button onClick={handleBackToHome} className="w-full">
          Back to home
        </Button>
      </>
    );
  }

  if (status === "cancelled") {
    return (
      <>
        <p>The login process was cancelled</p>
        <Button onClick={handleBackToHome} className="w-full">
          Back to home
        </Button>
      </>
    );
  }

  return null;
}
