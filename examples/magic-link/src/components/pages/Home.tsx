import { useAccount, useIsAuthenticated } from "jazz-react";
import { AuthButtons } from "../AuthButtons.tsx";
import { Logo } from "../Logo.tsx";

function App() {
  const { me } = useAccount({ profile: {} });

  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      <header>
        <nav className="container flex flex-col items-center gap-4 py-8">
          {isAuthenticated ? (
            <span>You're logged in!</span>
          ) : (
            <span>Sign up or log in to get started</span>
          )}

          <AuthButtons />
        </nav>
      </header>

      <main className="container flex flex-col gap-8">
        <Logo />

        <div className="text-center">
          <h1>Welcome{me?.profile.name ? <>, {me?.profile.name}</> : ""}!</h1>
        </div>
      </main>
    </>
  );
}

export default App;
