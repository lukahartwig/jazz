import { useCreateMagicLinkAuth } from "jazz-react";
import { useState } from "react";
import { Button } from "./Button";
import { ConfirmationCodeForm } from "./ConfirmationCodeForm";
import { QRCode } from "./QRCode";

interface CreateMagicLinkAsTargetProps {
  onLoggedIn: () => void;
}

export function CreateMagicLinkAsTarget({
  onLoggedIn,
}: CreateMagicLinkAsTargetProps) {
  const [link, setLink] = useState<string | undefined>();

  const { status, createLink, sendConfirmationCode } = useCreateMagicLinkAuth({
    as: "target",
    targetHandlerPath: "/#/magic-link-handler-target",
    sourceHandlerPath: "/#/magic-link-handler-source",
    onLoggedIn,
  });

  const onCreateLink = () => createLink().then(setLink);

  if (status === "idle") {
    return (
      <Button color="primary" onClick={onCreateLink}>
        Create QR code
      </Button>
    );
  }

  if (status === "waitingForHandler") {
    return (
      <>
        <p>Scan QR code to log in</p>

        {link ? <QRCode url={link} /> : null}
      </>
    );
  }

  if (status === "confirmationCodeRequired") {
    return (
      <>
        <p>Enter the confirmation code displayed on your other device</p>

        {sendConfirmationCode ? (
          <ConfirmationCodeForm onSubmit={sendConfirmationCode} />
        ) : null}
      </>
    );
  }

  if (status === "confirmationCodePending") {
    return <p>Confirming...</p>;
  }

  if (status === "authorized") {
    return <p>Logged in!</p>;
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>Incorrect confirmation code!</p>

        <Button color="primary" onClick={onCreateLink}>
          Try again
        </Button>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <p>Something went wrong</p>

        <Button onClick={onCreateLink}>Try again</Button>
      </>
    );
  }

  if (status === "cancelled") {
    return (
      <>
        <p>Cancelled</p>

        <Button onClick={onCreateLink}>Try again</Button>
      </>
    );
  }

  return null;
}
