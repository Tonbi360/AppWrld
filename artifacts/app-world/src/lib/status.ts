export const SUBMISSION_STATUSES = [
  "received",
  "under_review",
  "needs_info",
  "confirmed",
  "in_progress",
  "fixed",
  "released",
  "rejected",
  "duplicate",
] as const;

export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];

export interface StatusMeta {
  label: string;
  description: string;
  cssClass: string;
  isTerminal: boolean;
  isActive: boolean;
  order: number;
}

export const STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  received: {
    label: "Received",
    description: "Your submission arrived and is in the queue.",
    cssClass: "status-received",
    isTerminal: false,
    isActive: true,
    order: 0,
  },
  under_review: {
    label: "Under Review",
    description: "A reviewer is actively looking at this.",
    cssClass: "status-under_review",
    isTerminal: false,
    isActive: true,
    order: 1,
  },
  needs_info: {
    label: "Needs More Info",
    description: "We need more details before we can proceed.",
    cssClass: "status-needs_info",
    isTerminal: false,
    isActive: true,
    order: 2,
  },
  confirmed: {
    label: "Confirmed",
    description: "The submission has been verified and accepted.",
    cssClass: "status-confirmed",
    isTerminal: false,
    isActive: false,
    order: 3,
  },
  in_progress: {
    label: "In Progress",
    description: "Work has started — this is being handled.",
    cssClass: "status-in_progress",
    isTerminal: false,
    isActive: true,
    order: 4,
  },
  fixed: {
    label: "Fixed Internally",
    description: "Resolved — changes will ship in the next release.",
    cssClass: "status-fixed",
    isTerminal: false,
    isActive: false,
    order: 5,
  },
  released: {
    label: "Released",
    description: "Live. This is now part of AppWorld.",
    cssClass: "status-released",
    isTerminal: true,
    isActive: false,
    order: 6,
  },
  rejected: {
    label: "Rejected",
    description: "This submission was not accepted.",
    cssClass: "status-rejected",
    isTerminal: true,
    isActive: false,
    order: 7,
  },
  duplicate: {
    label: "Duplicate",
    description: "An identical submission already exists.",
    cssClass: "status-duplicate",
    isTerminal: true,
    isActive: false,
    order: 8,
  },
};

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_META[status as SubmissionStatus] ?? {
    label: status,
    description: "",
    cssClass: "status-received",
    isTerminal: false,
    isActive: false,
    order: 0,
  };
}
