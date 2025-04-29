import { Route, Routes } from "react-router";
import CrossDeviceAccountTransferHandlerSourcePage from "./components/pages/CrossDeviceAccountTransferHandlerSource.tsx";
import CrossDeviceAccountTransferHandlerTargetPage from "./components/pages/CrossDeviceAccountTransferHandlerTarget.tsx";
import HomePage from "./components/pages/HomePage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/account-transfer-handler-target/:transferId/:inviteSecret"
        element={<CrossDeviceAccountTransferHandlerTargetPage />}
      />
      <Route
        path="/account-transfer-handler-source/:transferId/:inviteSecret"
        element={<CrossDeviceAccountTransferHandlerSourcePage />}
      />
    </Routes>
  );
}

export default App;
