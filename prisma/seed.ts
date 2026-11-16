import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');
  const createAdminOnly = process.env.SEED_CREATE_ADMIN_ONLY === 'true';
  const demoDataOnly = process.env.SEED_DEMO_DATA_ONLY === 'true';
  if (createAdminOnly && demoDataOnly) {
    throw new Error(
      'SEED_CREATE_ADMIN_ONLY y SEED_DEMO_DATA_ONLY no pueden usarse juntos.',
    );
  }

  if (!demoDataOnly) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (
      !adminEmail ||
      !adminEmail.includes('@') ||
      !adminPassword ||
      adminPassword.length < 6
    ) {
      throw new Error(
        'Configura un SEED_ADMIN_EMAIL válido y un SEED_ADMIN_PASSWORD de al menos 6 caracteres.',
      );
    }

    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    if (createAdminOnly) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
      });
      if (existingAdmin) {
        throw new Error(
          'El email de administrador ya existe; no se modificó ninguna cuenta.',
        );
      }
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedAdminPassword,
          firstName: 'Administrador',
          lastName: 'Demo',
          role: 'ADMINISTRADOR',
        },
      });
    } else {
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          password: hashedAdminPassword,
          role: 'ADMINISTRADOR',
          deletedAt: null,
        },
        create: {
          email: adminEmail,
          password: hashedAdminPassword,
          firstName: 'Administrador',
          lastName: 'Principal',
          role: 'ADMINISTRADOR',
        },
      });
    }
    console.log('✅ Usuario Administrador listo');
  }

  if (createAdminOnly) {
    console.log(
      '🎉 ¡Administrador de demostración creado sin modificar cuentas existentes!',
    );
    return;
  }

  const clientEmail = process.env.SEED_CLIENT_EMAIL?.trim().toLowerCase();
  const clientPassword = process.env.SEED_CLIENT_PASSWORD;
  if (Boolean(clientEmail) !== Boolean(clientPassword)) {
    throw new Error(
      'Configura SEED_CLIENT_EMAIL y SEED_CLIENT_PASSWORD juntos, o deja ambos vacíos.',
    );
  }
  if (clientEmail && clientPassword) {
    if (!clientEmail.includes('@') || clientPassword.length < 6) {
      throw new Error(
        'El cliente de demostración necesita un correo válido y una contraseña de al menos 6 caracteres.',
      );
    }
    const existingClient = await prisma.user.findUnique({
      where: { email: clientEmail },
    });
    if (
      existingClient &&
      (existingClient.role !== 'CLIENTE' || existingClient.deletedAt)
    ) {
      throw new Error(
        'El email de demostración ya existe y no pertenece a un cliente activo; no se modificó la cuenta.',
      );
    }
    const client =
      existingClient ??
      (await prisma.user.create({
        data: {
          email: clientEmail,
          password: await bcrypt.hash(clientPassword, 10),
          firstName: 'Cliente',
          lastName: 'Demo',
          role: 'CLIENTE',
        },
      }));
    const address = await prisma.address.findFirst({
      where: { userId: client.id },
    });

    if (!address) {
      await prisma.address.create({
        data: {
          street: 'Av. Winston Churchill 100',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          zipCode: '10101',
          isDefault: true,
          userId: client.id,
        },
      });
    }
    console.log('✅ Usuario y dirección de cliente listos');
  }

  if (!demoDataOnly) {
    const catElectronica = await prisma.category.upsert({
      where: { name: 'Electrónica' },
      update: { deletedAt: null },
      create: {
        name: 'Electrónica',
        description: 'Gadgets, computadoras y accesorios',
      },
    });

    const catRopa = await prisma.category.upsert({
      where: { name: 'Ropa' },
      update: { deletedAt: null },
      create: { name: 'Ropa', description: 'Vestimenta para hombre y mujer' },
    });
    console.log('✅ Categorías listas');

    const products = [
      {
        name: 'Laptop Gamer ASUS',
        description: 'Ryzen 7, 16GB RAM, 512GB SSD, RTX 3050',
        costPrice: 45000,
        salePrice: 55000,
        stock: 15,
        categoryId: catElectronica.id,
      },
      {
        name: 'Audífonos Bluetooth Sony',
        description: 'Cancelación de ruido activa, 30h de batería',
        costPrice: 4000,
        salePrice: 6500,
        stock: 50,
        categoryId: catElectronica.id,
      },
      {
        name: 'Camiseta Básica Algodón',
        description: '100% algodón, disponible en varias tallas',
        costPrice: 150,
        salePrice: 350,
        stock: 100,
        categoryId: catRopa.id,
      },
    ];

    for (const product of products) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: product.name },
      });
      if (!existingProduct) {
        await prisma.product.create({ data: product });
      }
    }
    console.log('✅ Productos base listos');
  }

  const technologyCategoryName = 'Accesorios tecnológicos';
  const existingTechnologyCategory = await prisma.category.findUnique({
    where: { name: technologyCategoryName },
  });
  if (existingTechnologyCategory?.deletedAt) {
    throw new Error(
      'La categoría de demostración existe, pero está inactiva; no se modificó.',
    );
  }
  const technologyCategory =
    existingTechnologyCategory ??
    (await prisma.category.create({
      data: {
        name: technologyCategoryName,
        description: 'Accesorios y dispositivos tecnológicos',
      },
    }));

  const technologyProductName = 'Cargador USB-C 45W';
  const existingTechnologyProduct = await prisma.product.findFirst({
    where: { name: technologyProductName },
  });
  if (
    existingTechnologyProduct &&
    (existingTechnologyProduct.deletedAt ||
      existingTechnologyProduct.categoryId !== technologyCategory.id)
  ) {
    throw new Error(
      'El producto de demostración ya existe con datos diferentes; no se modificó.',
    );
  }
  if (!existingTechnologyProduct) {
    await prisma.product.create({
      data: {
        name: technologyProductName,
        description: 'Cargador rápido USB-C compatible con equipos modernos.',
        costPrice: 650,
        salePrice: 1190,
        stock: 25,
        categoryId: technologyCategory.id,
      },
    });
  }
  console.log('✅ Producto y categoría tecnológicos listos');

  console.log('🎉 ¡Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
