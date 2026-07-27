import type { CampaignCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<CampaignCategory, string> = {
  WEDDING: "Wedding",
  INTRODUCTION: "Introduction",
  FUNERAL: "Funeral",
  MEDICAL: "Medical & Healthcare",
  EDUCATION: "Education",
  CHURCH: "Church",
  ALUMNI: "School reunion",
  COMMUNITY: "Community",
  OFFICE: "Office",
  BIRTHDAY: "Birthday",
  FAMILY_EMERGENCY: "Family emergency",
  ASSOCIATION: "Association",
  MEMBERSHIP: "Membership",
  FUNDRAISING: "Fundraising",
  OTHER: "Other",
};

export function categoryLabel(category: CampaignCategory) {
  return CATEGORY_LABELS[category] ?? category;
}
