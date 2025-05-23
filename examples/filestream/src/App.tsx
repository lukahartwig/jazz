import { FileWidget } from "./FileWidget.js";
import { Logo } from "./Logo.tsx";

function App() {
  return (
    <>
      <main className="container mt-16 flex flex-col gap-8">
        <Logo />
        <FileWidget />
      </main>
    </>
  );
}

export default App;
