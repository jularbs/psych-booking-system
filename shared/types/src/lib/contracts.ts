export type UserRole = 'PLATFORM_ADMIN' | 'PSYCHOLOGIST' | 'ASSISTANT' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ServiceItem {
  id: string;
  psychologistId: string;
  name: string;
  durationMinutes: number;
  priceMinor: number; // cents
  currency: 'PHP';
  isActive: boolean;
}

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'MEETING_PENDING';

export interface Appointment {
  id: string;
  customerId: string;
  psychologistId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
}

export interface VideoMeetingInfo {
  provider: 'ZOOM';
  joinUrl: string;
  meetingId: string;
}

export interface FormAssignment {
  id: string;
  appointmentId: string;
  formTemplateVersionId: string;
  dueAt: string;
  required: boolean;
}
