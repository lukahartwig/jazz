import { DemoAuthBasicUI, JazzProvider, useDemoAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JazzAccount } from "./schema.ts";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();

  return (
    <>
      <JazzProvider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=react-demo-auth-tailwind@garden.co"
        AccountSchema={JazzAccount}
      >
        {children}
      </JazzProvider>

      {authState.state !== "signedIn" && (
        <DemoAuthBasicUI appName="React + Demo Auth" state={authState} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>,
);
