import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import type { ProductImageUpload } from './product-image.storage';

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const productImageInterceptor = FileInterceptor('image', {
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10, parts: 11 },
  fileFilter: (_request, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(
        new BadRequestException('La imagen debe ser JPEG, PNG o WebP.'),
        false,
      );
      return;
    }
    callback(null, true);
  },
});

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Ruta pública para la web (solo stock > 0)
  @ApiOperation({ summary: 'Catálogo público (Web)' })
  @Get('web')
  findAllForWeb(@Query() queryDto: ProductQueryDto) {
    return this.productsService.findAllForWeb(queryDto);
  }

  // Ruta protegida: Ver inventario completo (con costPrice)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Inventario completo (Admin/Cajero)' })
  @Get()
  findAll(@Query() queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
  }

  // Ruta protegida: Ver un producto por ID
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Ver producto por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // Ruta protegida: Crear producto (Solo Admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Crear producto (Solo Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'costPrice', 'salePrice', 'stock', 'categoryId'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        costPrice: { type: 'number' },
        salePrice: { type: 'number' },
        stock: { type: 'integer' },
        categoryId: { type: 'integer' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(productImageInterceptor)
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image?: ProductImageUpload,
  ) {
    return this.productsService.create(createProductDto, image);
  }

  // Ruta protegida: Actualizar producto (Solo Admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Actualizar producto (Solo Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        costPrice: { type: 'number' },
        salePrice: { type: 'number' },
        stock: { type: 'integer' },
        categoryId: { type: 'integer' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(productImageInterceptor)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: ProductImageUpload,
  ) {
    return this.productsService.update(id, updateProductDto, image);
  }

  // Ruta protegida: Eliminar producto (Soft Delete - Solo Admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Eliminar producto (Soft Delete - Solo Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
