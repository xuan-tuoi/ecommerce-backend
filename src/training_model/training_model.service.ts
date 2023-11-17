import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class TrainingModelService {
  private readonly logger = new Logger(TrainingModelService.name);

  @Cron('* * 1 * * *') // cron job chạy vào 1h sáng hàng ngày
  // @Cron('45 * * * * *') // cron job chạy vào 1' 45s' sáng hàng ngày
  async handleCron() {
    try {
      const url = process.env.FLASK_SERVER;
      const response = await axios.get(`${url}/train-data`);
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
