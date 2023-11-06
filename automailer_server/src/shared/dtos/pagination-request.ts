import { Type } from 'class-transformer';
// import { IsInt, Max, Min } from 'class-validator';
import * as _ from 'lodash';

export type Constructor<I> = new (...args: any[]) => I;

export function PaginationRequestDto(defaultLimit = 10, maxLimit = 100) {
  class PaginationRequest {
    @Type(() => Number)
    page?: number = 1;

    @Type(() => Number)
    limit?: number = defaultLimit;

    getFilter(): Omit<this, 'page' | 'limit'> {
      return _.omit(this, ['page', 'limit']);
    }
  }

  return PaginationRequest;
}
