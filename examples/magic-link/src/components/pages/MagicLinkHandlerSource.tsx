import { useHandleMagicLinkAuth } from "jazz-react";
import { BackToHomepageContainer } from "../BackToHomepageContainer";

export default function MagicLinkHandlerSourcePage() {
  return (
    <main className="container flex flex-col items-center gap-4 px-4 py-8 text-center">
      <h1 className="text-xl">Magic Link Auth Source Handler</h1>
      <HandleMagicLinkAsSource />
    </main>
  );
}

function HandleMagicLinkAsSource() {
  const { status, confirmationCode } = useHandleMagicLinkAuth({
    as: "source",
    targetHandlerPath: "/#/magic-link-handler-target",
    sourceHandlerPath: "/#/magic-link-handler-source",
  });

  if (status === "idle") {
    return <p>Loading...</p>;
  }

  if (status === "confirmationCodeGenerated") {
    return (
      <>
        <p>Confirmation code:</p>
        <p className="font-medium text-3xl tracking-widest">
          {confirmationCode ?? "empty"}
        </p>
        <p className="text-red-600">Never share this code with anyone!</p>
      </>
    );
  }

  if (status === "authorized") {
    return (
      <BackToHomepageContainer>
        Your device has been logged in!
      </BackToHomepageContainer>
    );
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>Incorrect confirmation code</p>
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
