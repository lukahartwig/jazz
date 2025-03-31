"use client";

import { useAccount, usePasskeyAuth } from "jazz-react";
import { useState } from "react";
import { APPLICATION_NAME } from "../main";
import { CreateMagicLinkAsConsumer } from "./CreateMagicLinkAsConsumer";
import { CreateMagicLinkAsProvider } from "./CreateMagicLinkAsProvider";

export function AuthButtons() {
  const { logOut } = useAccount();

  const auth = usePasskeyAuth({ appName: APPLICATION_NAME });

  const [magicLinkFlow, setMagicLinkFlow] = useState(false);

  function handleLogOut() {
    logOut();
    window.history.pushState({}, "", "/");
  }

  if (auth.state === "signedIn") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={handleLogOut}
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
          >
            Log out
          </button>

          <button
            onClick={() => setMagicLinkFlow(true)}
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
          >
            Log in your mobile device
          </button>
        </div>

        {magicLinkFlow ? <CreateMagicLinkAsProvider /> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
          onClick={() => auth.signUp("supercoolusername")}
        >
          Sign up
        </button>

        <button
          onClick={() => auth.logIn()}
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
        >
          Log in with passkey
        </button>

        <button
          onClick={() => setMagicLinkFlow(true)}
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
        >
          Log in via mobile device
        </button>
      </div>

      {magicLinkFlow ? (
        <CreateMagicLinkAsConsumer
          onLoggedIn={() => {
            console.log("logged in!");
            setMagicLinkFlow(false);
          }}
        />
      ) : null}
    </div>
  );
}
