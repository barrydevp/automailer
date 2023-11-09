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
    iconColor: "stroke-blue-500",
    textColor: "text-blue-500",
  },
  {
    value: eAccountStatus.AUTO,
    label: "Auto",
    icon: CheckCircleIcon,
    iconColor: "stroke-green-500",
    textColor: "text-green-500",
  },
  {
    value: eAccountStatus.CRED_INVALID,
    label: "Cred Invalid",
    icon: ExclamationTriangleIcon,
    iconColor: "stroke-red-500",
    textColor: "text-red-500",
  },
  {
    value: eAccountStatus.INACTIVE,
    label: "Inactive",
    icon: CrossCircledIcon,
    iconColor: "stroke-gray-500",
    textColor: "text-gray-500",
  },
];
