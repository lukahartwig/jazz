import { useHandleMagicLinkAuthAsConsumer } from "jazz-react";

export default function MagicLinkHandlerConsumer() {
  const { status } = useHandleMagicLinkAuthAsConsumer({
    consumerHandlerPath: "/#/magic-link-handler-consumer",
    providerHandlerPath: "/#/magic-link-handler-provider",
    onLoggedIn: () => {
      console.log("logged in!");
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <p>MagicLinkHandlerConsumer status: {status}</p>
    </div>
  );
}
