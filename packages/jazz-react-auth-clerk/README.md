# `jazz-react-auth-clerk`

This package provides a [Clerk-based](https://clerk.com/) authentication strategy for Jazz's React bindings.

## Usage

The `JazzProviderWithClerk` component is a JazzProvider that automatically handles Clerk authentication.

Once authenticated, authentication will persist across page reloads, even if the device is offline.

See the full [example app](https://github.com/garden-co/jazz/tree/main/examples/clerk) for a complete example.

```tsx
import { ClerkProvider, useClerk } from "@clerk/clerk-react";
import { JazzProviderWithClerk } from "jazz-react-auth-clerk";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function JazzProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();

  return (
    <JazzProviderWithClerk
      clerk={clerk}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=your-email-address",
      }}
    >
      {children}
    </JazzProviderWithClerk>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <JazzProvider>
        <App />
      </JazzProvider>
    </ClerkProvider>
  </StrictMode>,
);
