import type { AppRole } from "@/lib/types"

export const roleOptions: { id: AppRole; label: string; note: string }[] = [
  { id: "ba", label: "Business analyst", note: "Authors the record." },
  { id: "reviewer", label: "Reviewer", note: "Comments and requests changes." },
  { id: "approver", label: "Approver", note: "Approves a requirement." },
  { id: "architect", label: "Architect", note: "Can edit solution structure." },
  { id: "developer", label: "Developer", note: "Reads the record." },
  { id: "tester", label: "Tester", note: "Reads acceptance and scenarios." },
]

export function canAuthor(role: AppRole) {
  return role === "ba" || role === "architect"
}

export function canReview(role: AppRole) {
  return role === "reviewer" || role === "ba"
}

export function canApprove(role: AppRole) {
  return role === "approver"
}
