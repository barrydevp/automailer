import { AccountTable } from "./account-table";
import { useQuery } from "react-query";
import { findAccount } from "@/services/api";
import { FindAccountResponse } from "@/@types/services/api";
import ConnectorButton from "./connect-button";
import { toastError } from "@/components/ui/use-toast";

export const metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

export default function AccountPage() {
  const query = useQuery("accounts", findAccount, {
    initialData: { data: [], page: 1, limit: 10 },
    onError: (err: any) => {
      if (err?.response?.data?.message) {
        err.message = err.response.data.message;
      }
      toastError(err);
    },
  });
  const { data: accounts } = query.data as FindAccountResponse;

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ConnectorButton />
        </div>
        <AccountTable data={accounts} />
      </div>
    </>
  );
}
