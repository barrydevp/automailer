import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "@/app/layout";
import IndexPage from "./page";
import ErrorPage from "./error-page";
import DashboardPage from "./dashboard/page";
import AccountPage from "./accounts/page";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    loader() {
      // Our root route always provides the user, if logged in
      // return { user: fakeAuthProvider.username };
      return { hello: "root" };
    },
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        // element: <IndexPage />,
        element: <Navigate to="/accounts" />
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "accounts",
        element: <AccountPage />,
      },
      // {
      //   path: "protected",
      //   loader: protectedLoader,
      //   Component: ProtectedPage,
      // },
    ],
  },
  {
    path: "/logout",
    async action() {
      // We signout in a "resource route" that we can hit from a fetcher.Form
      // await fakeAuthProvider.signout();
      // return redirect("/");
    },
  },
]);
