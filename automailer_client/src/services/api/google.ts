import ApiService from "@/services/api-service";
import type { AuthUrlResponse } from "@@types/services/api";

const PREFIX = "/google";

export async function genAuthUrl({ state }: { state?: string }) {
  let url = `${PREFIX}/auth-url`;
  if (state) {
    url = `${url}?state=${state}`;
  }
  return ApiService.fetchData<AuthUrlResponse>({
    url: url,
    method: "get",
  });
}
