import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from '../common/config/configuration.module';
import { HealthModule } from '../modules/health/health.module';
import { RequestLoggerMiddleware } from '../common/logger/request-logger.middleware';
import { LoggerModule } from '../common/logger/logger.module';
@Module({
  imports: [ConfigurationModule, LoggerModule, HealthModule, DatabaseModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
