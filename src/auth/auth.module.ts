import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, NatsModule],
})
export class AuthModule {}
