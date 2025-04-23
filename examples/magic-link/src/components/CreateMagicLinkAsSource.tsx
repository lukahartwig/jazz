import { useCreateMagicLinkAuth } from "jazz-react";
import { useState } from "react";
import { Button } from "./Button";
import { QRCode } from "./QRCode";

export function CreateMagicLinkAsSource() {
  const [link, setLink] = useState<string | undefined>();

  const { status, createLink, confirmationCode } = useCreateMagicLinkAuth({
    as: "source",
    targetHandlerPath: "/#/magic-link-handler-target",
    sourceHandlerPath: "/#/magic-link-handler-source",
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
        <p>Scan QR code to get your mobile device logged in</p>

        {link ? <QRCode url={link} /> : null}
      </>
    );
  }

  if (status === "confirmationCodeGenerated") {
    return (
      <>
        <p>Confirmation code:</p>

        <p className="font-medium text-3xl tracking-widest">
          {confirmationCode ?? "empty"}
        </p>
      </>
    );
  }

  if (status === "confirmationCodeCorrect") {
    return <p>Confirmed! Logging in...</p>;
  }

  if (status === "authorized") {
    return <p>Your device has been logged in!</p>;
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>Incorrect confirmation code</p>

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
        <p>Login cancelled</p>

        <Button color="primary" onClick={onCreateLink}>
          Try again
        </Button>
      </>
    );
  }

  return null;
}
