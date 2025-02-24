import { useIframeHashRouter } from "hash-slash";
import { ID } from "jazz-tools";
import { CreateOrder } from "./CreateOrder.tsx";
import { EditOrder } from "./EditOrder.tsx";
import { Orders } from "./Orders.tsx";
import { BubbleTeaOrder } from "./schema.ts";

function App() {
  const router = useIframeHashRouter();

  return (
    <>
      <main className="container py-8 space-y-8">
        {router.route({
          "/": () => <Orders />,
          "/order": () => <CreateOrder />,
          "/order/:id": (id) => <EditOrder id={id as ID<BubbleTeaOrder>} />,
        })}
      </main>
    </>
  );
}

export default App;
