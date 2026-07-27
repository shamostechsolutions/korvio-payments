import type { PaymentStatus } from "@prisma/client";

export function mapPawapayDepositStatus(status: string): PaymentStatus {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "SUCCESSFUL";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export function mapPawapayCheckoutStatus(status: string): PaymentStatus {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "SUCCESSFUL";
    case "FAILED":
      return "FAILED";
    case "EXPIRED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export function mapPawapayPayoutStatus(status: string): "COMPLETED" | "FAILED" | "PROCESSING" {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "COMPLETED";
    case "FAILED":
      return "FAILED";
    default:
      return "PROCESSING";
  }
}
