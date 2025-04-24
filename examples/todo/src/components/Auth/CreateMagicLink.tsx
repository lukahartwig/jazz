import { Button } from "@/basicComponents/ui/button";
import { useCreateMagicLinkAuth } from "jazz-react";
import { useEffect, useRef, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../basicComponents/ui/input-otp";
import { QRCode } from "./QRCode";

interface CreateMagicLinkProps {
  onLoggedIn: () => void;
}

export function CreateMagicLink({ onLoggedIn }: CreateMagicLinkProps) {
  const [link, setLink] = useState<string | undefined>();
  const [confirmationCode, setConfirmationCode] = useState("");
  const createdLinkRef = useRef<boolean>(false);

  const { status, createLink, sendConfirmationCode } = useCreateMagicLinkAuth({
    as: "target",
    sourceHandlerPath: "/#/magic-link-handler-source",
    onLoggedIn,
  });

  const onCreateLink = () => createLink().then(setLink);

  useEffect(() => {
    if (createdLinkRef.current) return;
    createdLinkRef.current = true;
    onCreateLink();
  }, []);

  if (status === "idle") {
    return <p>Loading...</p>;
  }

  if (status === "waitingForHandler") {
    return (
      <>
        <p>Scan the QR code from your logged-in mobile device</p>

        {link ? <QRCode url={link} /> : null}
      </>
    );
  }

  if (status === "confirmationCodeRequired") {
    return (
      <>
        <p>Enter the code displayed on your mobile device</p>

        <InputOTP
          maxLength={6}
          value={confirmationCode}
          onChange={(value) => setConfirmationCode(value)}
          onComplete={() => sendConfirmationCode?.(confirmationCode)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </>
    );
  }

  if (status === "confirmationCodePending") {
    return (
      <>
        <p>Checking code...</p>
      </>
    );
  }

  if (status === "authorized") {
    return (
      <>
        <p>Authorized! 🚀</p>
      </>
    );
  }

  if (status === "confirmationCodeIncorrect") {
    return (
      <>
        <p>Incorrect code - please try again</p>
        <Button onClick={onCreateLink} className="w-full">
          Try again
        </Button>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <p>Oops! Something went wrong</p>
        <Button onClick={onCreateLink} className="w-full">
          Try again
        </Button>
      </>
    );
  }

  if (status === "cancelled") {
    return (
      <>
        <p>Authentication cancelled</p>
        <Button onClick={onCreateLink} className="w-full">
          Try again
        </Button>
      </>
    );
  }

  return null;
}
