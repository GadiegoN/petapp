export type Period = "morning" | "afternoon" | "night";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "done"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  userId: string;
  organizationId?: string;
  tutorId?: string;
  domesticPetId?: string;
  date: string;
  time: string;
  petName: string;
  tutorName: string;
  phone: string;
  service: string;
  serviceIds?: string[];
  productIds?: string[];
  status?: AppointmentStatus;
  notes?: string;
  period: Period;
};

export type AppointmentFormData = {
  tutorName: string;
  petName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  tutorId?: string;
  domesticPetId?: string;
};
