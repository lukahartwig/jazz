import { useCreateMagicLinkAuth } from "jazz-react";
import { useState } from "react";
import { Button } from "./Button";
import { QRCodeContainer } from "./QRCodeContainer";

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
      <div className="flex flex-col items-center gap-4">
        <p>Scan QR code to get your mobile device logged in</p>

        {link ? <QRCodeContainer url={link} /> : null}
      </div>
    );
  }

  if (status === "confirmationCodeGenerated") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p>Confirmation code:</p>
        <p className="font-medium text-3xl tracking-widest">
          {confirmationCode ?? "empty"}
        </p>
      </div>
    );
  }

  if (status === "confirmationCodeCorrect") {
    return <p>Confirmed! Logging in...</p>;
  }

  if (status === "authorized") return <p>Your device has been logged in!</p>;

  if (status === "confirmationCodeIncorrect") {
    return (
      <div className="flex flex-col gap-4">
        <p>Incorrect confirmation code</p>

        <Button color="primary" onClick={onCreateLink}>
          Start again
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <p>Something went wrong</p>

        <button onClick={onCreateLink}>Try again</button>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex flex-col gap-4">
        <p>Login cancelled</p>

        <Button color="primary" onClick={onCreateLink}>
          Start again
        </Button>
      </div>
    );
  }

  return null;
}
