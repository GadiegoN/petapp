import type { TimestampFields, Visibility } from "./common";

export type SponsorType = "person" | "company" | "organization";

export type SponsorStatus = "active" | "paused" | "inactive";

export type SponsorshipTargetType = "streetDog" | "supportPoint" | "campaign";

export type SponsorshipStatus = "active" | "paused" | "ended";

export type Sponsor = TimestampFields & {
  id: string;
  name: string;
  type: SponsorType;
  logoUrl?: string;
  siteUrl?: string;
  contact?: string;
  visibility: Visibility;
  status: SponsorStatus;
};

export type Sponsorship = {
  id: string;
  sponsorId: string;
  targetType: SponsorshipTargetType;
  targetId: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  status: SponsorshipStatus;
  publicDisplay: boolean;
};
