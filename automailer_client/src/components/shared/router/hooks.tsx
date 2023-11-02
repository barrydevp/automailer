import { useMemo } from "react";
import {
  NavigateFunction,
  NavigateOptions,
  To,
  useLocation,
  useNavigate,
} from "react-router-dom";

export function usePathname() {
  const location = useLocation();

  return location.pathname;
}

export type Router = {
  // route: string
  // pathname: string
  // query: ParsedUrlQuery
  // asPath: string
  // basePath: string
  // locale?: string | undefined
  // locales?: string[] | undefined
  // defaultLocale?: string | undefined
  // domainLocales?: DomainLocale[] | undefined
  // isLocaleDomain: boolean
  push: NavigateFunction;
};

export function useRouter(): Router {
  const navigate = useNavigate();

  const router = useMemo(() => {
    return {
      push: (to: To, options?: NavigateOptions) => {
        navigate(to, options);
      },
    };
  }, [navigate]);

  return router as Router;
}
