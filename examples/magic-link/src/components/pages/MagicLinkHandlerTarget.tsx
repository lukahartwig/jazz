import { useHandleMagicLinkAuth } from "jazz-react";
import { BackToHomepageContainer } from "../BackToHomepageContainer";
import { ConfirmationCodeForm } from "../ConfirmationCodeForm";

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

  switch (status) {
    case "idle":
      return <p>Loading...</p>;

    case "confirmationCodeRequired":
      return (
        <>
          <p>Enter the confirmation code displayed on your other device</p>

          {sendConfirmationCode ? (
            <ConfirmationCodeForm onSubmit={sendConfirmationCode} />
          ) : null}
        </>
      );

    case "confirmationCodePending":
      return <p>Confirming...</p>;

    case "authorized":
      return <BackToHomepageContainer>Logged in!</BackToHomepageContainer>;

    case "confirmationCodeIncorrect":
      return (
        <>
          <p>Incorrect confirmation code!</p>
          <p>Please try again</p>
        </>
      );

    case "error":
      return (
        <BackToHomepageContainer>Something went wrong</BackToHomepageContainer>
      );

    case "cancelled":
      return <BackToHomepageContainer>Login cancelled</BackToHomepageContainer>;

    default:
      const check: never = status;
      if (check) throw new Error(`Unhandled status: ${check}`);
  }
}
