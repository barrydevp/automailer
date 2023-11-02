import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { QueryProvider } from "@/components/shared/providers/query-provider";
import "@/App.css";

function App() {
  return (
    <QueryProvider>
      <RouterProvider
        router={router}
        fallbackElement={<p>Initial Load...</p>}
      />
    </QueryProvider>
  );
}

export default App;
