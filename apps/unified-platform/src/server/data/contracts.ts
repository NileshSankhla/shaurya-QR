import type { StaffRole } from "@/lib/auth";

export type StaffRecord = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: string;
  active: boolean;
};

export type GuestInput = {
  name: string;
  college: string;
  mobile: string;
  email: string;
};

export type GuestScope = "ACTIVE" | "REMOVED" | "ALL";
export type GuestAssignmentFilter = "ALL" | "ASSIGNED" | "UNASSIGNED";
export type GuestSearchField =
  | "all"
  | "name"
  | "college"
  | "mobile"
  | "email"
  | "qr";
export type GuestSortField =
  | "createdAt"
  | "name"
  | "college"
  | "mobile"
  | "email"
  | "status";
export type SortDirection = "asc" | "desc";

export type GuestListFilters = {
  scope: GuestScope;
  assignment: GuestAssignmentFilter;
  field: GuestSearchField;
  sortBy: GuestSortField;
  direction: SortDirection;
};

export type GuestHistory = {
  guest: GuestSearchResult & {
    createdAt: string;
    removedAt: string | null;
  };
  totals: {
    mealsVerified: number;
    scanAttempts: number;
    rejectedScans: number;
  };
  timeline: Array<{
    id: string;
    kind: "REGISTRATION" | "ACCOUNT" | "QR" | "MEAL" | "REJECTED_SCAN";
    title: string;
    description: string;
    actor: string | null;
    qrToken: string | null;
    slotTitle: string | null;
    successful: boolean | null;
    createdAt: string;
  }>;
};

export type StaffInput = {
  name: string;
  username: string;
  passwordHash: string;
  role: StaffRole;
};

export type StaffUpdateInput = {
  name: string;
  username: string;
  role: StaffRole;
  passwordHash?: string;
};

export type SlotInput = {
  dayLabel: string;
  eventDate: string;
  title: string;
  startTime: string;
  endTime: string;
};

export type GuestSearchResult = {
  id: string;
  name: string;
  college: string;
  mobile: string;
  email: string;
  status: string;
  active: boolean;
  qrToken: string | null;
  mealsVerified: number;
};

export type VolunteerHome = {
  totalGuests: number;
  scannedByMe: number;
  verifiedByMe: number;
  activeSlot: null | {
    id: number;
    title: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
    served: number;
  };
  recent: Array<{
    id: string;
    successful: boolean;
    guestName: string;
    slotTitle: string;
    reason: string | null;
    createdAt: string;
  }>;
};

export type AdminOverview = {
  totals: {
    guests: number;
    assigned: number;
    availableQrs: number;
    verifiedMeals: number;
    scanAttempts: number;
    activeVolunteers: number;
  };
  activeSlot: null | {
    id: number;
    title: string;
    dayLabel: string;
    served: number;
    total: number;
  };
  collegeData: Array<{ college: string; count: number }>;
  dayOverview: Array<Record<string, string | number>>;
  heatmap: Record<string, Record<string, number>>;
  cumulativeData: Array<{ label: string; value: number }>;
  volunteerPerformance: Array<{
    id: string;
    name: string;
    role: string;
    active: boolean;
    scanned: number;
    verified: number;
  }>;
  recent: Array<{
    id: string;
    successful: boolean;
    guestName: string;
    volunteerName: string;
    slotTitle: string;
    reason: string | null;
    createdAt: string;
  }>;
  recentPage: number;
  recentPages: number;
};

export interface PlatformStore {
  findStaffByUsername(username: string): Promise<StaffRecord | null>;
  upgradeStaffPassword(id: string, passwordHash: string): Promise<void>;
  registerGuest(input: GuestInput): Promise<GuestSearchResult>;
  updateGuest(
    guestId: string,
    input: GuestInput,
    actorName: string,
  ): Promise<GuestSearchResult>;
  searchGuests(query: string, limit?: number): Promise<GuestSearchResult[]>;
  createGuestAndAssign(
    input: GuestInput,
    qrToken: string,
    actorId: string,
    actorName: string,
  ): Promise<GuestSearchResult>;
  assignQr(guestId: string, qrToken: string, actorName: string): Promise<void>;
  unassignQr(guestId: string, actorName: string): Promise<void>;
  setGuestActive(
    guestId: string,
    active: boolean,
    actorName: string,
  ): Promise<void>;
  verifyMeal(
    qrToken: string,
    volunteerId: string,
  ): Promise<{
    success: boolean;
    reason?: string;
    guestName?: string;
    college?: string;
    slotTitle?: string;
  }>;
  getVolunteerHome(staffId: string): Promise<VolunteerHome>;
  getAdminOverview(recentPage?: number): Promise<AdminOverview>;
  getGuestHistory(guestId: string): Promise<GuestHistory | null>;
  listGuests(
    query: string,
    page: number,
    pageSize: number,
    filters?: GuestListFilters,
  ): Promise<{
    guests: GuestSearchResult[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  listStaff(): Promise<Array<Omit<StaffRecord, "passwordHash">>>;
  createStaff(input: StaffInput): Promise<void>;
  updateStaff(id: string, input: StaffUpdateInput): Promise<void>;
  setStaffActive(id: string, active: boolean): Promise<void>;
  listSlots(): Promise<
    Array<{
      id: number;
      title: string;
      status: string;
      dayLabel: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      served: number;
    }>
  >;
  createSlot(input: SlotInput): Promise<void>;
  updateSlot(id: number, input: SlotInput): Promise<void>;
  setSlotStatus(
    id: number,
    status: "SCHEDULED" | "ACTIVE" | "PAUSED" | "CLOSED",
  ): Promise<void>;
  deleteSlot(id: number): Promise<void>;
}
