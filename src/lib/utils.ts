import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "USD" | "BDT" = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getAuditDescription(action: string, model?: string) {
  const actionMap: Record<string, string> = {
    "INVESTMENT_CREATE": "Records the initialization of a new investment asset in the Financial Matrix.",
    "INVESTMENT_UPDATE": "Traces a modification to an investment entry's status in the Financial Ledger.",
    "INVESTMENT_DELETE": "Documents the permanent removal of an investment record from the system.",
    "EXPENSE_CREATE": "Logs the registration of a new operational expense in the tracking system.",
    "EXPENSE_UPDATE": "Captures revisions to an expense record, including status or amount adjustments.",
    "EXPENSE_DELETE": "Identifies the decommissioning of an expense entry.",
    "PROJECT_CREATE": "Initiates a new project lifecycle within the production pipeline.",
    "PROJECT_UPDATE": "Updates project milestones, assignments, or operational status.",
    "PROJECT_DELETE": "Records the termination of a project record.",
    "USER_LOGIN": "Authenticates user access and verifies system entry credentials.",
    "USER_CREATE": "Registers a new user identity within the QuoteXStudio workspace.",
    "USER_UPDATE": "Modifies user permissions, roles, or profile metadata.",
    "PAYOUT_CREATE": "Logs a new profit distribution to stakeholders.",
    "PAYOUT_UPDATE": "Revises a payout transaction in the historical ledger."
  };

  if (!action) return `Records an operation on the ${model || "system"} resource.`;

  return actionMap[action] || `Documents a ${action.toLowerCase().replace(/_/g, " ")} operation on the ${model || "system"} resource.`;
}
