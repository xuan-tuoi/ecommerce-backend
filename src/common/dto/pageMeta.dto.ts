import { PageMetaDtoParameters } from '../interfaces/pageMeta.dto.parameters';

export class PageMetaDto {
  readonly page: number;

  readonly limit: number;

  readonly itemCount: number;

  readonly pageCount: number;

  readonly hasNext: boolean;

  readonly hasPrev: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page;
    this.limit = pageOptionsDto.limit;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(itemCount / pageOptionsDto.limit);
    this.hasNext = pageOptionsDto.page < this.pageCount;
    this.hasPrev = pageOptionsDto.page > 1;
  }
}
