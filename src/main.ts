import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

import * as compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ExceptionsLoggerFilter } from './common/utils/exceptionLogger.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(compression());
  // Thêm cấu hình middleware để xử lý form-data
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.use(json({ limit: '50mb' }));

  const config = new DocumentBuilder()
    .setTitle('Beauty Ecommerce API')
    .setDescription('The cosmetic API description')
    .setVersion('1.0')
    .addTag('cosmetic')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');

  // Kích hoạt middleware error
  app.useGlobalFilters(new ExceptionsLoggerFilter());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://beauty-ecommerce-nine.vercel.app',
      'https://xuantuoi.pythonanywhere.com',
      'xuantuoi.pythonanywhere.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, type, X-Client-Id , X-Rtoken-Id',
    credentials: true,
  });

  await app.listen(3003);
}
bootstrap();

// http://localhost:3003/api#/
