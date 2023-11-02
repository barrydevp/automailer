export type AccountCredential = {
  accessToken: string;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
  idToken?: string;
  expriryDate?: Date;
};
