import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Listar usuarios activos (Solo Admin)' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Consultar personal activo por ID (Solo Admin)' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Crear usuario (Solo Admin)' })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      cajero: {
        summary: 'Crear usuario Cajero',
        value: {
          email: 'cajero2@demo.com',
          password: 'Cajero123!',
          firstName: 'Pedro',
          lastName: 'López',
          phone: '8095559999',
          role: 'CAJERO',
        },
      },
    },
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Actualizar personal activo (Solo Admin)' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (id === req.user.id && updateUserDto.role === 'CAJERO') {
      throw new BadRequestException('No puedes cambiar tu propio rol.');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Desactivar personal activo (Solo Admin)' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (id === req.user.id) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta.');
    }
    return this.usersService.remove(id);
  }
}
