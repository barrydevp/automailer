import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { GoogleModule } from './google/google.module';
import { AccountModule } from './account/account.module';
import {
  LoggerModule,
  createNestLoggingModuleOptions,
} from './common/logging/logger';
import * as packageJson from '../package.json';
import { join } from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'automailer/dist'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggerModule.forRoot(
      createNestLoggingModuleOptions({
        serviceName: packageJson.name,
        version: packageJson.version,
      }),
    ),
    ScheduleModule.forRoot(),
    DatabaseModule,
    GoogleModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
