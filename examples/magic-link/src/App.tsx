import { Route, Routes } from "react-router";
import Home from "./components/pages/Home.tsx";
import MagicLinkHandlerConsumer from "./components/pages/MagicLinkHandlerConsumer.tsx";
import MagicLinkHandlerProvider from "./components/pages/MagicLinkHandlerProvider.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/magic-link-handler-consumer/:transferId/:inviteSecret"
        element={<MagicLinkHandlerConsumer />}
      />
      <Route
        path="/magic-link-handler-provider/:transferId/:inviteSecret"
        element={<MagicLinkHandlerProvider />}
      />
    </Routes>
  );
}

export default App;
