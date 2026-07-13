import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from '../common/config/configuration.module';
import { HealthModule } from '../modules/health/health.module';
@Module({
  imports: [ConfigurationModule, HealthModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
