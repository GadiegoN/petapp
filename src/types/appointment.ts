export type Period = "morning" | "afternoon" | "night";

export type Appointment = {
  id: string;
  userId: string;
  date: string;
  time: string;
  petName: string;
  tutorName: string;
  phone: string;
  service: string;
  period: Period;
};

export type AppointmentFormData = {
  tutorName: string;
  petName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
};
