export const appConfig = {
  apiPrefix: import.meta.env.API_URL || "http://100.103.32.144:3000/api",
  authenticatedEntryPath: "/home",
  unAuthenticatedEntryPath: "/sign-in",
  tourPath: "/",
  locale: "en",
};

export type AppConfig = typeof appConfig;
