import { usePathname } from "@/components/shared/router";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { genAuthUrl } from "@/services/api/google";
import { PlusCircledIcon } from "@radix-ui/react-icons";

export default function ConnectorButton() {
  const pathname = usePathname();

  async function onClick() {
    try {
      const authParams = await genAuthUrl({ state: pathname });
      const { url } = authParams || {};
      if (!url) {
        throw new Error(`Invalid auth url, ${JSON.stringify(authParams)}`);
      }

      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "There was a problem with your request.",
        action: (
          <ToastAction altText="Try again" onClick={onClick}>
            Try again
          </ToastAction>
        ),
      });
    }
  }

  return (
    <div className="ml-auto mr-4">
      <Button onClick={onClick}>
        <PlusCircledIcon className="mr-2 h-4 w-4" />
        Connect account
      </Button>
    </div>
  );
}
