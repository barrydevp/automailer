"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "react-query";
import { bulkWriteAccount, manualMoveGmail } from "@/services/api";
import { toastError, toastSuccess } from "@/components/ui/use-toast";
import { Account } from "@/@types/services/api";
import { eAccountStatus } from "./constants";

interface DataTableRowActionsProps {
  row: Row<Account>;
}

export function RowActions({ row }: DataTableRowActionsProps) {
  const queryClient = useQueryClient();

  const { mutateAsync: bulkWrite } = useMutation(bulkWriteAccount, {
    onSuccess: async () => {
      await queryClient.refetchQueries({
        predicate: ({ queryKey }) => queryKey.includes("accounts"),
      });
      toastSuccess("Change applied!");
    },
    onError: (e) => {
      toastError(e);
    },
  });

  const { mutateAsync: manualMoveGmailMutation } = useMutation(
    manualMoveGmail,
    {
      onSuccess: async (data: any) => {
        const moveGmail = data?.moveGmail;

        if (!moveGmail) {
          toastError("No response");
        } else {
          toastSuccess(
            "Move report: " +
              `moved{${moveGmail[0]?.moved}} ` +
              `uration{${moveGmail[0]?.duration}} ` +
              `error{${moveGmail[0]?.error || ""}}`,
          );
        }
      },
      onError: (e) => {
        toastError(e);
      },
    },
  );

  const onToggleAuto = async () => {
    if (
      !(
        row?.original?._id &&
        [eAccountStatus.AUTO, eAccountStatus.MANUAL].includes(
          row.original.status,
        )
      )
    ) {
      toastError("Cannot toggle.");
      return;
    }

    const { status, _id } = row.original;

    await bulkWrite({
      update: [
        {
          _id: _id,
          status:
            status === eAccountStatus.AUTO
              ? eAccountStatus.MANUAL
              : eAccountStatus.AUTO,
        },
      ],
    });
  };

  const onDelete = async () => {
    if (!row?.original?._id) {
      return;
    }

    const { _id } = row.original;

    await bulkWrite({
      delete: [{ _id: _id }],
    });
  };

  const onManualMoveGmail = async () => {
    if (!row?.original?._id) {
      return;
    }

    const { _id, status } = row.original;

    if (![eAccountStatus.AUTO, eAccountStatus.MANUAL].includes(status)) {
      toastError(`Cannot run account while in status "${status}".`);
      return;
    }

    await manualMoveGmailMutation({
      moveGmail: [{ _id: _id }],
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={onToggleAuto}>Toggle auto</DropdownMenuItem>
        <DropdownMenuItem onClick={onManualMoveGmail}>
          Manual run
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete}>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
