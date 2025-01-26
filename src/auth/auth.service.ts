import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';

import { PrismaClient } from '@prisma/client';

import { LoginUserDto, RegisterUserDto } from './dto';
import * as brcypt from 'bcrypt';
import { JwtPayload } from './interfaces';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly loggger = new Logger('AuthService');

  async onModuleInit() {
    await this.$connect();
    this.loggger.log('Databse connected.');
  }

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;
    try {
      const userDB = await this.user.findUnique({ where: { email } });

      if (userDB) {
        throw new RpcException({ status: 400, message: 'User alreday exists' });
      }

      const user = await this.user.create({
        data: {
          email,
          name,
          password: brcypt.hashSync(password, 10),
        },
      });

      const { password: __, ...rest } = user;
      const tokenJwt = await this.signJWT({ id: rest.id, email: rest.email });
      return {
        user: rest,
        token: tokenJwt,
      };
    } catch (error) {
      throw new RpcException({ status: 400, message: error.message });
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const userDB = await this.user.findUnique({ where: { email } });

      if (!userDB) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = brcypt.compareSync(password, userDB.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
        });
      }

      const { password: __, ...rest } = userDB;
      const tokenJwt = await this.signJWT({ id: rest.id, email: rest.email });
      return {
        user: rest,
        token: tokenJwt,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'An unexpected error occurred',
      });
    }
  }

  logout() {
    return 'Logout user';
  }

  async verifyToken(token: string) {
    try {
      const { sub__, iat__, exp__, ...rest } = await this.jwtService.verify(
        token,
        {
          secret: envs.jwtSecret,
        },
      );

      return {
        user: rest,
        token: await this.signJWT({ id: rest.id, email: rest.email }),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({ status: 400, message: 'Invalid Token' });
    }
  }

  private signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}
