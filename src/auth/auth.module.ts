import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { NatsModule } from 'src/transports/nats.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { envs } from 'src/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, NatsModule],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.jwtSecret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class AuthModule {}
