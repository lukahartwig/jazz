import { useBetterAuth } from "jazz-react-auth-betterauth";
import { useState } from "react";
import { BetterAuthBasicEmailSignInUI } from "./BetterAuthBasicEmailSignInUI";
import { BetterAuthBasicEmailSignUpUI } from "./BetterAuthBasicEmailSignUpUI";
import { Button } from "./atoms/Button";

export const BetterAuthBasicEmailUI = (props: {
  baseUrl: string;
  children?: React.ReactNode;
}) => {
  const auth = useBetterAuth({ baseURL: props.baseUrl });
  const [menuState, setMenuState] = useState<"initial" | "signUp" | "signIn">(
    "initial",
  );

  if (auth.state === "signedIn") return props.children ?? null;

  return (
    <main className="h-full max-w-xl mx-auto px-4 flex flex-col gap-4 justify-center min-h-screen">
      {menuState === "initial" && (
        <div className="w-full flex flex-col gap-6">
          <Button onClick={() => setMenuState("signUp")}>Sign up</Button>
          <Button onClick={() => setMenuState("signIn")}>Sign in</Button>
        </div>
      )}
      {menuState === "signUp" && (
        <BetterAuthBasicEmailSignUpUI auth={auth} setMenuState={setMenuState} />
      )}
      {menuState === "signIn" && (
        <BetterAuthBasicEmailSignInUI auth={auth} setMenuState={setMenuState} />
      )}
    </main>
  );
};
