import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
