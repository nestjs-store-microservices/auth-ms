import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';

import { PrismaClient } from '@prisma/client';

import * as brcypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dto';
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

  /**
   * Method that permit create a new user
   * @param registerUserDto Object with properties necessary for create a user
   * @returns Object with user data and token JWT
   */
  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, fullName, password, isActive, roles } = registerUserDto;
    try {
      const userDB = await this.user.findUnique({ where: { email } });

      if (userDB) {
        throw new RpcException({ status: 400, message: 'User alreday exists' });
      }

      const user = await this.user.create({
        data: {
          email,
          fullName,
          password: brcypt.hashSync(password, 10),
          isActive,
          roles,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          password: false,
          isActive: false,
          roles: false,
        },
      });

      const tokenJwt = await this.signJWT({ id: user.id });
      return {
        user,
        token: tokenJwt,
      };
    } catch (error) {
      throw new RpcException({ status: 400, message: error.message });
    }
  }

  /**
   * Method that permit signin
   * @param loginUserDto Object with properties required for login
   * @returns Object with user data and token JWT
   */
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const userDB = await this.user.findUnique({ where: { email } });

      if (!userDB) {
        this.handleMessageUnauthorized();
      }

      if (!userDB.isActive) {
        this.handleMessageUnauthorized();
      }

      const isPasswordValid = brcypt.compareSync(password, userDB.password);

      if (!isPasswordValid) {
        this.handleMessageUnauthorized();
      }

      const { password: __password, isActive: __isActive, ...rest } = userDB;
      const tokenJwt = await this.signJWT({ id: rest.id });
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

  /**
   * Method that permit verify token JWT
   * @param token Token JWT value
   * @returns Object with user data and Token JWT
   */
  async verifyToken(token: string) {
    try {
      const { sub__, iat__, exp__, ...rest } = await this.jwtService.verify(
        token,
        {
          secret: envs.jwtSecret,
        },
      );

      const {
        password: __password,
        isActive: __isActive,
        ...userDB
      } = await this.user.findUnique({ where: { id: rest.id } });

      return {
        user: userDB,
        token: await this.signJWT({ id: rest.id }),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({ status: 400, message: 'Invalid Token' });
    }
  }

  private signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  private handleMessageUnauthorized(): never {
    throw new RpcException({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }
}
