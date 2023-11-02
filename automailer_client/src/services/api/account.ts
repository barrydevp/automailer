import ApiService from "@/services/api-service";
import type { FindAccountResponse } from "@@types/services/api";

const PREFIX = "/accounts";

export async function findAccount() {
  return ApiService.fetchData<FindAccountResponse>({
    url: `${PREFIX}`,
    method: "get",
  });
}
