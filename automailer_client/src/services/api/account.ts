import ApiService from "@/services/api-service";
import type {
  BulkWriteAccountDto,
  FindAccountResponse,
  ManualActionDto,
  ManualMoveGmailResponse,
} from "@@types/services/api";

const PREFIX = "/accounts";

export async function findAccount() {
  return ApiService.fetchData<FindAccountResponse>({
    url: `${PREFIX}`,
    method: "get",
  });
}

export async function bulkWriteAccount(body: BulkWriteAccountDto) {
  return ApiService.fetchData<any>({
    url: `${PREFIX}/bulk-write`,
    method: "post",
    data: body,
  });
}

export async function manualMoveGmail(body: ManualActionDto) {
  return ApiService.fetchData<ManualMoveGmailResponse>({
    url: `${PREFIX}/manual-move-gmail`,
    method: "post",
    data: body,
  });
}
