import { format } from 'date-fns';

export function toDateDay(date: Date) {
  return format(date, 'MM-dd-yyyy');
}
