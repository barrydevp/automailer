import { Account } from "@/@types/services/api";
import { DataTable } from "@/components/shared/data-table";

import { columns } from "./columns";

export interface AccountTableProps {
  data: Account[];
}

export function AccountTable({ data }: AccountTableProps) {
  return <DataTable data={data} columns={columns} />;
}
