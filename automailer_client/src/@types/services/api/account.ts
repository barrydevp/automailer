import {
  eAccountStatus,
  eAccountType,
} from "@/app/accounts/account-table/constants";

export type Account = {
  _id: string;
  externalId?: string;
  type: eAccountType;
  email: string;
  verifiedEmail?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  // credentials?: Record<string, string>;
  // stats?; // if populate is not call then objectId otw AccountStats
  status: eAccountStatus;
  connectAt?: Date;
  deactiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type FindAccountResponse = {
  data: Account[];
  page: number;
  limit: number;
  total: number;
};

export type BulkWriteAccountDto = {
  update?: Partial<Account>[];
  delete?: { _id: string }[];
};

export type AccountIdDto = {
  _id: string;
};

export type ManualActionDto = {
  ids: string[];
};

export type ManualTriggerResponse = {
  data: AccountIdDto &
    {
      moved?: number;
      replied?: number;
      duration?: number;
      err?: string;
    }[];
};
