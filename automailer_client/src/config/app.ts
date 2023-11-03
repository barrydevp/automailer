export const appConfig = {
  apiPrefix: import.meta.env.API_URL || "https://svof.xyz/api",
  authenticatedEntryPath: "/home",
  unAuthenticatedEntryPath: "/sign-in",
  tourPath: "/",
  locale: "en",
};

export type AppConfig = typeof appConfig;
