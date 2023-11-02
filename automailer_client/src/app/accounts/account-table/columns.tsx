"use client";

import { AvatarImage } from "@radix-ui/react-avatar";
import { createColumnHelper } from "@tanstack/react-table";

import { Account } from "@/@types/services/api";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { RowActions } from "./actions";
import { statuses, labels } from "./constants";

const columnHelper = createColumnHelper<Account>();

export const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <div className="text-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      </div>
    ),
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="name" />
    ),
    cell: (info) => {
      return (
        <div className="flex items-center space-x-4">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={info.row.original.picture}
              alt={`@${info.getValue()}`}
            />
            <AvatarFallback>
              {`${info.getValue()}`.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">
              {info.getValue()}
            </p>
            <p className="text-sm text-muted-foreground">
              {info.row.original.email}
            </p>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="status" />
    ),
    cell: (info) => {
      const status = statuses.find(
        (status) => status.value === info.getValue(),
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <RowActions row={row} />
        </div>
      );
    },
  }),
];
