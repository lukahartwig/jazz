import App from "@/App.tsx";
import "@/index.css";
import { HRAccount } from "@/schema.ts";
import { JazzProvider } from "jazz-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { apiKey } from "./apiKey";

const peer =
  (new URL(window.location.href).searchParams.get(
    "peer",
  ) as `ws://${string}`) ?? `wss://cloud.jazz.tools/?key=${apiKey}`;

declare module "jazz-react" {
  interface Register {
    Account: HRAccount;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzProvider
      AccountSchema={HRAccount}
      sync={{
        peer,
      }}
    >
      <App />
    </JazzProvider>
  </React.StrictMode>,
);
