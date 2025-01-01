import { Form } from "./Form.tsx";
import { Logo } from "./Logo.tsx";
import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <>
      <header>
        <nav className="container flex justify-between items-center py-3">
          <span>
            You're logged in as <strong>{me?.profile?.name}</strong>
          </span>
          <button
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
            onClick={() => logOut()}
          >
            Log out
          </button>
        </nav>
      </header>
      <main className="container mt-16 flex flex-col gap-8">
        <Logo />

        <Form />

        <p className="text-center">
          Edit your first name, {""}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-semibold underline"
          >
            refresh
          </button>{" "}
          this page, and see your changes persist.
        </p>

        <p className="text-center">
          Edit <code className="font-semibold">schema.ts</code> to add more
          fields.
        </p>

        <p className="text-center mt-16">
          Go to{" "}
          <a
            className="font-semibold underline"
            href="https://jazz.tools/docs/react/guide"
          >
            jazz.tools/docs/react/guide
          </a>{" "}
          for a full tutorial.
        </p>
      </main>
    </>
  );
}

export default App;
