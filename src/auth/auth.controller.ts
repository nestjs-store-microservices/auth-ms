import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  registerUser() {
    return 'login';
  }

  @MessagePattern('auth.login.user')
  loginUser() {
    return 'login';
  }

  @MessagePattern('auth.logout.user')
  logoutUser() {
    return 'login';
  }

  @MessagePattern('auth.verify.token')
  verifyToken() {
    return 'verify';
  }
}
