export type Account = {
  externalId?: string;
  type: string;
  email: string;
  verifiedEmail?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  // credentials?: Record<string, string>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FindAccountResponse = {
  data?: Account[];
  page?: number;
  limit?: number;
};
