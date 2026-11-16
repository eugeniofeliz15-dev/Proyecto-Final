# 🛒 POS & E-commerce System

Sistema híbrido de Punto de Venta (POS) y tienda en línea, con una API REST en NestJS y un frontend en React. Comparte catálogo e inventario entre las ventas de mostrador y las compras web, con acceso basado en roles.

## 🌐 Enlaces en producción

- **Tienda y aplicación web:** [https://proyecto-final-gamma-kohl.vercel.app](https://proyecto-final-gamma-kohl.vercel.app)
- **Documentación interactiva de la API (Swagger):** [https://proyecto-final-354o.onrender.com/api/docs](https://proyecto-final-354o.onrender.com/api/docs)

## ✨ Funcionalidades

- **Cliente:** registro, catálogo, carrito, direcciones, checkout y consulta de pedidos. Si MockPay no está disponible al crear el enlace de pago, el pedido queda pendiente y se puede reintentar desde “Mis pedidos”; no se marca como pagado sin confirmación.
- **Cajero:** POS para registrar ventas, elegir el método de pago y consultar el historial diario de ventas.
- **Administrador:** gestión de productos y categorías, administración del personal, seguimiento y cambio de estado de pedidos, y apertura/cierre de caja con conciliación. La cola de pedidos muestra el cliente, la dirección y los productos comprados con cantidades y subtotales.
- **Inventario compartido:** las ventas del POS y los pedidos web utilizan el inventario del mismo sistema.
- **Seguridad:** autenticación JWT, autorización por roles, validación de DTOs, validación de configuración, CORS y límite global de solicitudes.
- **Pedidos y catálogo:** listas paginadas y filtrables, y eliminación lógica de productos para conservar referencias históricas.
- **Imágenes de productos:** carga opcional de archivos JPEG, PNG o WebP de hasta 5 MB.
- **Pagos:** integración con MockPay y endpoint de webhook autenticado para confirmar pagos de forma asíncrona.
- **API documentada:** Swagger/OpenAPI disponible en `/api/docs`.

## 🛠️ Stack tecnológico

### Backend

- NestJS y TypeScript
- Prisma y PostgreSQL (Supabase)
- JWT, Passport, bcryptjs, Helmet y `@nestjs/throttler`
- Joi para validar variables de entorno; `class-validator` y `class-transformer` para validar DTOs
- Swagger/OpenAPI

### Frontend

- React 19, Vite y TypeScript
- Tailwind CSS
- Zustand
- React Hook Form y Zod
- Axios y React Router DOM v6

### Despliegue

- Frontend: Vercel
- API: Render
- Base de datos: Supabase (usa una URL de conexión compatible con el entorno de despliegue)

## 🚀 Instalación y ejecución local

### Requisitos

- Node.js y pnpm
- Una base de datos PostgreSQL local o en la nube

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/eugeniofeliz15-dev/pos-ecommerce-api.git
cd pos-ecommerce-api
pnpm install
```

La raíz del repositorio es un workspace de pnpm que incluye `frontend/`; no es necesario instalar sus dependencias por separado.

### USUARIOS 
ADMIN: admin@gmail.com 
CONTRASEÑAñ qwerty123

los otros los puedes crear con el admin y editarlos en la configuracion de USUARIOS

### 2. Configurar y ejecutar el backend

Crea un archivo `.env` en la raíz del repositorio. No hay un `.env.example` para el backend; configura al menos estas variables:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="reemplaza-por-un-secreto-largo-y-aleatorio"
PORT=10000
CORS_ORIGIN="http://localhost:5173,http://localhost:4173"
```

`DATABASE_URL` y `JWT_SECRET` son obligatorias. `PORT` es opcional (por defecto `10000`). `CORS_ORIGIN` acepta una lista de orígenes separados por comas; si se omite, el navegador no podrá llamar a la API desde el frontend local.

Aplica las migraciones existentes e inicia la API:

```bash
pnpm exec prisma migrate deploy
pnpm start:dev
```

La API local estará en `http://localhost:10000` y Swagger en `http://localhost:10000/api/docs`.

### 3. Crear datos iniciales (opcional)

Para ejecutar el seed completo, define `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `.env` (contraseña de al menos 6 caracteres) y ejecuta:

```bash
pnpm exec prisma db seed
```

El seed completo crea o actualiza el administrador indicado y carga datos de catálogo. Si también quieres un cliente de demostración, define `SEED_CLIENT_EMAIL` y `SEED_CLIENT_PASSWORD`; deben configurarse juntos. Como el seed completo actualiza la contraseña y el rol si encuentra el correo del administrador, usa el modo de creación exclusiva si no quieres modificar una cuenta existente. En PowerShell:

```powershell
$env:SEED_CREATE_ADMIN_ONLY = 'true'
pnpm exec prisma db seed
```

Ese modo crea el administrador solo si el correo no existe; ante una colisión, aborta sin modificar cuentas.

Para cargar solo el cliente y los datos de demostración, configura `SEED_CLIENT_EMAIL` y `SEED_CLIENT_PASSWORD` y ejecuta en PowerShell:

```powershell
$env:SEED_DEMO_DATA_ONLY = 'true'
pnpm exec prisma db seed
```

Este modo no cambia la cuenta de administrador ni crea el catálogo base.

### 4. Configurar y ejecutar el frontend

Copia el ejemplo de entorno del frontend y verifica que la URL de la API coincida con el puerto local:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

El archivo debe contener:

```dotenv
VITE_API_URL=http://localhost:10000/api
```

Inicia Vite desde la raíz del workspace:

```bash
pnpm --filter pos-ecommerce-frontend dev
```

## ⚙️ Configuración de producción

- En **Vercel**, selecciona `frontend/` como directorio raíz y define `VITE_API_URL` con la URL pública de la API terminada en `/api`.
- En **Render**, configura `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGIN`. Usa la raíz del repositorio, `pnpm install --frozen-lockfile && pnpm build` para compilar y `pnpm start:prod` para iniciar.
- Añade el origen del frontend desplegado a `CORS_ORIGIN` en la API. Por ejemplo: `https://proyecto-final-gamma-kohl.vercel.app`.
- El backend crea las imágenes en `uploads/products/`. El sistema de archivos de un despliegue puede ser efímero; configura almacenamiento persistente para esa carpeta o integra un proveedor de almacenamiento de objetos antes de depender de imágenes cargadas en producción.



## 📌 Rutas útiles

- `GET /api/addresses` y `POST /api/addresses`: consultar y crear direcciones del cliente autenticado.
- `PATCH /api/addresses/:id`: actualizar una dirección propia.
- `GET /api/cart`, `POST /api/cart/add` y `DELETE /api/cart/remove/:productId`: operaciones del carrito.
- `GET /api/users` y `POST /api/users`: listar y crear usuarios del personal (solo Administrador).
- `GET /api/orders?page=1&limit=10&status=PENDIENTE`: cola de pedidos para Administrador/Cajero, con cliente, dirección, productos, cantidades y subtotales; permite paginar y filtrar.
- `POST /api/orders/:id/payment-link`: reintentar la creación de un enlace de pago.
- `POST /api/products` y `PATCH /api/products/:id`: crear o actualizar productos con `multipart/form-data`; la imagen opcional se envía en el campo `image`.

---

Desarrollado por **Cristian Eugenio Claudio Feliz** | 2026
