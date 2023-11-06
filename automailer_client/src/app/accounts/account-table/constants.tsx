import {
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { CheckCircleIcon } from "lucide-react";

export enum eAccountType {
  NONE = "none",
  GOOGLE = "google",
}

export enum eAccountStatus {
  MANUAL = "manual",
  AUTO = "auto",
  CRED_INVALID = "cred_invalid",
  INACTIVE = "inactive",
}

export const statuses = [
  {
    value: eAccountStatus.MANUAL,
    label: "Manual",
    icon: InfoCircledIcon,
    color: "text-blue-500",
  },
  {
    value: eAccountStatus.AUTO,
    label: "Auto",
    icon: CheckCircleIcon,
    color: "text-green-500",
  },
  {
    value: eAccountStatus.CRED_INVALID,
    label: "Cred Invalid",
    icon: ExclamationTriangleIcon,
    color: "text-red-500",
  },
  {
    value: eAccountStatus.INACTIVE,
    label: "Inactive",
    icon: CrossCircledIcon,
    color: "text-gray-500",
  },
];
