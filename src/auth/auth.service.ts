import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import type { User } from '../../generated/prisma';
import * as bcrypt from 'bcryptjs';

type AuthPrincipal = Pick<User, 'id' | 'email' | 'role'>;
type JwtExpiration = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser)
      throw new ConflictException('El correo ya está registrado');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        role: 'CLIENTE',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
      },
    });

    return this.generateToken(user);
  }

  // Método para Passport LocalStrategy
  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthPrincipal | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      if (user.deletedAt) {
        throw new UnauthorizedException('Usuario inactivo o eliminado');
      }
      return { id: user.id, email: user.email, role: user.role };
    }
    return null;
  }

  async login(user: AuthPrincipal) {
    return this.generateToken(user);
  }

  private generateToken(user: AuthPrincipal) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<JwtExpiration>('JWT_EXPIRATION'),
      }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
