import { Route, Routes } from "react-router";
import HomePage from "./components/pages/HomePage.tsx";
import MagicLinkHandlerTargetPage from "./components/pages/MagicLinkHandlerTarget.tsx";
import MagicLinkHandlerSourcePage from "./components/pages/MagicLinkHandlerSource.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/magic-link-handler-target/:transferId/:inviteSecret"
        element={<MagicLinkHandlerTargetPage />}
      />
      <Route
        path="/magic-link-handler-source/:transferId/:inviteSecret"
        element={<MagicLinkHandlerSourcePage />}
      />
    </Routes>
  );
}

export default App;
