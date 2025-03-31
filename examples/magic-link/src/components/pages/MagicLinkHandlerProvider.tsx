import { useHandleMagicLinkAuthAsProvider } from "jazz-react";

export default function MagicLinkHandlerProvider() {
  const { status, confirmLogIn } = useHandleMagicLinkAuthAsProvider({
    consumerHandlerPath: "/#/magic-link-handler-consumer",
    providerHandlerPath: "/#/magic-link-handler-provider",
  });

  if (status === "idle") return <p>Loading...</p>;

  if (status === "waitingForConfirmLogIn") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p>Are you sure you want to log in?</p>
        <button
          onClick={confirmLogIn}
          className="bg-blue-600 text-white p-2 font-lg"
        >
          Confirm Log In
        </button>
      </div>
    );
  }

  if (status === "confirmedLogIn") return <p>Confirmed! Logging in...</p>;
  if (status === "authorized") return <p>Logged in!</p>;
  if (status === "expired") return <p>Link expired</p>;
  if (status === "error") return <p>Something went wrong</p>;
}
