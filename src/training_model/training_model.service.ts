import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class TrainingModelService {
  private readonly logger = new Logger(TrainingModelService.name);

  @Cron('45 * * * * *')
  async handleCron() {
    const url = 'http://127.0.0.1:5000/trainUserKmeans';
    const data = await axios.get(url);
    this.logger.debug(data.data.mess);
    // this.logger.debug(data.mess);
  }
}
