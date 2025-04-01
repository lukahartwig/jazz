import { useHandleMagicLinkAuthAsProvider } from "jazz-react";
import { BackToHomepageContainer } from "../BackToHomepageContainer";
import { Button } from "../Button";

export default function MagicLinkHandlerProviderPage() {
  return (
    <main className="container flex flex-col items-center gap-4 px-4 py-8 text-center">
      <h1 className="text-xl">Magic Link Auth Provider Handler</h1>
      <MagicLinkHandlerProvider />
    </main>
  );
}

function MagicLinkHandlerProvider() {
  const { status, confirmLogIn } = useHandleMagicLinkAuthAsProvider({
    consumerHandlerPath: "/#/magic-link-handler-consumer",
    providerHandlerPath: "/#/magic-link-handler-provider",
  });

  if (status === "idle") return <p>Loading...</p>;

  if (status === "waitingForConfirmLogIn") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p>You scanned the QR code!</p>

        <p>Are you sure you want to log in?</p>

        <Button color="primary" onClick={confirmLogIn}>
          Confirm log in
        </Button>
      </div>
    );
  }

  if (status === "confirmedLogIn") {
    return <p>Confirmed! Logging in...</p>;
  }

  if (status === "authorized") {
    return (
      <BackToHomepageContainer>
        Your device is logged in!
      </BackToHomepageContainer>
    );
  }

  if (status === "expired") {
    return <BackToHomepageContainer>Link expired</BackToHomepageContainer>;
  }

  if (status === "error") {
    return (
      <BackToHomepageContainer>Something went wrong</BackToHomepageContainer>
    );
  }

  return null;
}
