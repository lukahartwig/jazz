"use client";

import { useCreateMagicLinkAuthAsProvider } from "jazz-react";
import { useState } from "react";
import { QRCodeContainer } from "./QRCodeContainer";

export function CreateMagicLinkAsProvider() {
  const [link, setLink] = useState<string | null>(null);

  const { status, createLink, confirmLogIn } = useCreateMagicLinkAuthAsProvider(
    {
      consumerHandlerPath: "/#/magic-link-handler-consumer",
      providerHandlerPath: "/#/magic-link-handler-provider",
      autoConfirmLogIn: false,
    },
  );

  if (status === "idle") {
    return (
      <button onClick={() => createLink().then(setLink)}>Create QR code</button>
    );
  }

  if (status === "waitingForConsumer") {
    return (
      <div className="flex flex-col gap-2">
        <p>Scan QR code to log in your mobile device</p>
        {link ? <QRCodeContainer url={link} /> : null}
      </div>
    );
  }

  if (status === "waitingForConfirmLogIn") {
    return (
      <div className="flex flex-col gap-2">
        <p>A device has scanned the QR code!</p>
        <p>Click confirm to allow the device to log in</p>
        <button
          onClick={() => confirmLogIn()}
          className="bg-blue-600 text-white p-2 font-lg"
        >
          Confirm log in
        </button>
      </div>
    );
  }

  if (status === "confirmedLogIn") return <p>Confirmed! Logging in...</p>;
  if (status === "authorized") return <p>Logged in!</p>;
  if (status === "expired") return <p>Link expired</p>;
  if (status === "error") return <p>Something went wrong</p>;

  return null;
}
