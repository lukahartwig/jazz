import { JazzProvider, PassphraseAuthBasicUI } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { wordlist } from "./wordlist.ts";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      sync={{
        peer: "wss://cloud.jazz.tools/?key=minimal-auth-passphrase-example@garden.co",
        when: "signedUp",
      }}
    >
      <PassphraseAuthBasicUI
        appName="Jazz Minimal Auth Passphrase Example"
        wordlist={wordlist}
      >
        {children}
      </PassphraseAuthBasicUI>
    </JazzProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>,
);
