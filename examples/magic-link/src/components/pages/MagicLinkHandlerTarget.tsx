import { useHandleMagicLinkAuth } from "jazz-react";
import { BackToHomepageContainer } from "../BackToHomepageContainer";
import { ConfirmationCodeInput } from "../ConfirmationCodeInput";

export default function MagicLinkHandlerTargetPage() {
  return (
    <main className="container flex flex-col items-center gap-4 px-4 py-8 text-center">
      <h1 className="text-xl">Magic Link Auth Target Handler</h1>
      <HandleMagicLinkAsTarget />
    </main>
  );
}

function HandleMagicLinkAsTarget() {
  const { status, sendConfirmationCode } = useHandleMagicLinkAuth({
    as: "target",
    targetHandlerPath: "/#/magic-link-handler-target",
    sourceHandlerPath: "/#/magic-link-handler-source",
    onLoggedIn: () => {
      console.log("logged in!");
    },
  });

  if (status === "idle") {
    return <p>Loading...</p>;
  }

  if (status === "confirmationCodeRequired") {
    return (
      <>
        <p>Enter the confirmation code displayed on your other device</p>

        {sendConfirmationCode ? (
          <ConfirmationCodeInput onSubmit={sendConfirmationCode} />
        ) : null}
      </>
    );
  }

  if (status === "confirmationCodePending") {
    return <p>Confirming...</p>;
  }

  if (status === "authorized") {
    return <BackToHomepageContainer>Logged in!</BackToHomepageContainer>;
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>Incorrect confirmation code!</p>
        <p>Please try again</p>
      </>
    );
  }

  if (status === "error") {
    return (
      <BackToHomepageContainer>Something went wrong</BackToHomepageContainer>
    );
  }

  if (status === "cancelled") {
    return <BackToHomepageContainer>Login cancelled</BackToHomepageContainer>;
  }

  return null;
}
