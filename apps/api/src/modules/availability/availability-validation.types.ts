export type AvailabilityValidationReason =
  | 'invalid_time_zone'
  | 'invalid_time_range'
  | 'slot_outside_availability_window'
  | 'slot_overlaps_blackout_window'
  | 'slot_overlaps_google_busy_time';

export interface AvailabilityValidationResult {
  isValid: boolean;
  reason: AvailabilityValidationReason | null;
}
