import { Navigate, Outlet } from "react-router-dom";
// import appConfig from "@/configs/app.config";
// import useAuth from "@/utils/hooks/useAuth";
//
// const { authenticatedEntryPath } = appConfig;

export const PublicRoute = () => {
  // const { authenticated } = useAuth();

  // return authenticated ? <Navigate to={authenticatedEntryPath} /> : <Outlet />;
  return <Outlet />;
};

export default PublicRoute;
