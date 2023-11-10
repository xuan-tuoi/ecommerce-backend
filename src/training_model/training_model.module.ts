import { Module } from '@nestjs/common';
import { TrainingModelService } from './training_model.service';

@Module({
  providers: [TrainingModelService],
})
export class TrainingModelModule {}
