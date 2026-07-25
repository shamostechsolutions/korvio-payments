import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nano = customAlphabet(alphabet, 4);

export function generateCampaignCode(name: string, year = new Date().getFullYear()): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const base = (initials || "KRV").slice(0, 3);
  return `${base}-${year}-${nano()}`;
}

export function generateTransactionReference(campaignCode: string): string {
  return `KRV-${campaignCode.split("-")[0]}-${customAlphabet("0123456789", 5)()}`;
}

export function whatsappJoinLink(businessNumber: string, campaignCode: string): string {
  const text = encodeURIComponent(`JOIN ${campaignCode}`);
  return `https://wa.me/${businessNumber}?text=${text}`;
}

export function whatsappPayLink(
  businessNumber: string,
  campaignCode: string,
  amount?: number,
): string {
  const message = amount
    ? `PAY ${campaignCode} ${amount}`
    : `JOIN ${campaignCode}`;
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
}
