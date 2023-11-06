import { eAccountStatus, eAccountType } from '@/database/schemas';
import { PaginationRequestDto } from '../../shared/dtos/pagination-request';

const LIMIT = {
  DEFAULT: 10,
  MAX: 100,
};

export class FindAccountRequestDto extends PaginationRequestDto(
  LIMIT.DEFAULT,
  LIMIT.MAX,
) {
  q?: string;
  email?: string;
  name?: string;
  type?: eAccountType | eAccountType[];
  status?: eAccountStatus | eAccountStatus[];
}
