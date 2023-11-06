import { Account } from "@/@types/services/api";
import { DataTable } from "@/components/shared/data-table";

import { columns } from "./columns";
import { AccountTableToolbar } from "./toolbar";

export interface AccountTableProps {
  data: Account[];
}

export function AccountTable({ data }: AccountTableProps) {
  return (
    <DataTable
      toolbarRender={({ table }) => <AccountTableToolbar table={table} />}
      data={data}
      columns={columns}
    />
  );
}
