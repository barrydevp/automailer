import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger, getErrorInterceptor } from './common/logging/logger';
// import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.flushLogs();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  app.useGlobalInterceptors(getErrorInterceptor());
  // app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix('api');

  await app.listen(Number(process.env.PORT || 3000), '0.0.0.0');
}
bootstrap();
