import { DateTime } from 'luxon';

/**
 * Returns a date/time that's a nice round number in the future.
 * At least an hour away, at the top of the hour.
 */
export const getDefaultDateTime = () => {
  const hours = DateTime.local().hour + 2;
  const date = DateTime.local().set({ hours, minutes: 0, seconds: 0, milliseconds: 0 }).toUTC().toString();

  return date;
}
