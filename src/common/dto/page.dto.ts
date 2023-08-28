import { IsArray } from 'class-validator';
import { PageMetaDto } from './pageMeta.dto';

export class PageDto<T> {
  @IsArray()
  readonly datas: T[];

  readonly meta: PageMetaDto;

  constructor(datas: T[], meta: PageMetaDto) {
    this.datas = datas;
    this.meta = meta;
  }
}
