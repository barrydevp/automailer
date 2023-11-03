export const appConfig = {
  apiPrefix: import.meta.env.VITE_API_URL || "/api",
  authenticatedEntryPath: "/home",
  unAuthenticatedEntryPath: "/sign-in",
  tourPath: "/",
  locale: "en",
};

export type AppConfig = typeof appConfig;
