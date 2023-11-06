"use client";

import { Cross2Icon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTableFacetedFilter,
  DataTableToolbarProps,
} from "@/components/shared/data-table";
import { Account } from "@/@types/services/api";

import { statuses } from "./constants";

export function AccountTableToolbar({ table }: DataTableToolbarProps<Account>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <>
      <Input
        placeholder="Search email..."
        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("email")?.setFilterValue(event.target.value)
        }
        className="h-8 w-[150px] lg:w-[250px]"
      />
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statuses}
        />
      )}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <Cross2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}
    </>
  );
}
