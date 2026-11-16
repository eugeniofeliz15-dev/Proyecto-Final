# 🛒 POS & E-commerce API

API RESTful robusta y escalable para un sistema híbrido de Punto de Venta (POS) y Tienda en Línea (E-commerce). Construida con NestJS, Prisma y PostgreSQL.

## 🚀 Características Principales

- **Autenticación y Autorización:** JWT con roles (Administrador, Cajero, Cliente).
- **Seguridad Blindada:** Rate Limiting, Helmet, CORS y validación estricta de entorno (Joi).
- **Integridad de Datos:** Soft Delete para proteger el historial financiero y de inventario.
- **Rendimiento:** Paginación implementada en módulos de alto tráfico.
- **Pasarela de Pagos:** Checkout MockPay con confirmación asíncrona de órdenes mediante webhook autenticado.
- **Documentación:** Swagger UI interactivo y completo.

## 🛠️ Stack Tecnológico

- **Framework:** [NestJS](https://nestjs.com/)
- **Base de Datos:** PostgreSQL (vía [Supabase](https://supabase.com/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Hosting:** [Render](https://render.com/)

## 🌍 API en Producción

La API está desplegada y disponible 24/7 en:
👉 *_[https://pos-ecommerce-api-24lq.onrender.com/api/docs]_

## ⚙️ Instalación Local

1. Clona el repositorio: `git clone https://github.com/eugeniofeliz15-dev/pos-ecommerce-api.git`
2. Instala dependencias: `pnpm install`
3. Configura la API en `.env` (no subas este archivo): `DATABASE_URL`, un `JWT_SECRET` aleatorio, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y `CORS_ORIGIN` (por ejemplo, `http://localhost:5173,http://localhost:4173`). `PORT` es opcional (por defecto `10000`). Si no configuras `CORS_ORIGIN`, el navegador no podrá llamar a la API desde otro origen. Usa correos y contraseñas propios; no hay credenciales de demostración predeterminadas.
4. Ejecuta migraciones: `pnpm prisma migrate dev`
5. Ejecuta `pnpm prisma db seed` para crear el administrador y los datos de catálogo. Define también `SEED_CLIENT_EMAIL` y `SEED_CLIENT_PASSWORD` si necesitas un cliente de demostración; ambos son opcionales y deben configurarse juntos.
6. Inicia el servidor: `pnpm start:dev`

En Render, usa la raíz del repositorio, `pnpm install --frozen-lockfile && pnpm build` como comando de compilación y `pnpm start:prod` como comando de inicio. El build regenera Prisma Client para la plataforma de destino; configura `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGIN` en las variables de entorno del servicio.

Para cargar únicamente el cliente, la categoría y el producto tecnológico de demostración sin tocar la cuenta de administrador ni crear el catálogo base, configura `SEED_CLIENT_EMAIL` y `SEED_CLIENT_PASSWORD` en `.env`, luego ejecuta en PowerShell:

```powershell
$env:SEED_DEMO_DATA_ONLY = 'true'
pnpm prisma db seed
```

Este modo conserva los registros existentes y no cambia la contraseña ni el rol de un cliente que ya exista.

Para crear un administrador local nuevo sin restablecer la contraseña de ninguna cuenta existente, configura `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `.env`; después ejecuta en PowerShell:

```powershell
$env:SEED_CREATE_ADMIN_ONLY = 'true'
pnpm prisma db seed
```

El modo de administrador solo crea la cuenta si el correo aún no existe; ante una colisión, aborta sin modificar usuarios.

## 🖥️ Frontend

El frontend React/Vite vive en `frontend/` y consume esta API; no se conecta directamente a PostgreSQL ni contiene credenciales de Prisma.

1. Copia `frontend/.env.example` a `frontend/.env.local` y ajusta `VITE_API_URL` si tu API usa otro puerto.
2. Ejecuta `pnpm --filter pos-ecommerce-frontend dev`.
3. La API local usa el puerto definido por `PORT` en `.env` (por defecto `10000`). Asegúrate de que `VITE_API_URL` coincida con ese puerto. Swagger está disponible en `/api/docs`.

Para Vercel, configura `frontend/` como directorio raíz del proyecto y define `VITE_API_URL` en el panel de variables del entorno, apuntando a la URL pública de la API con el sufijo `/api`. En la API, agrega el dominio de Vercel a `CORS_ORIGIN`. No se guarda una URL de producción en el código fuente.

Incluye catálogo, autenticación por roles, POS e historial de ventas, carrito y checkout MockPay, administración de usuarios del personal (solo Administrador), cola paginada de pedidos con transiciones optimistas y apertura/cierre de caja (solo Administrador).

Los productos aceptan una imagen opcional por `multipart/form-data` en `POST /api/products` y `PATCH /api/products/:id` (campo `image`, JPEG/PNG/WebP, máximo 5 MB). El backend valida el contenido, guarda el archivo en `uploads/products/` y persiste su ruta en `products.imageUrl`; la API sirve esas imágenes desde `/uploads/products/`. La vitrina pública incluye la imagen, pero sigue excluyendo el costo de adquisición. En producción, configura almacenamiento persistente para esa carpeta o conecta un proveedor de objetos antes del despliegue.

Rutas de apoyo: `GET/POST /api/addresses` y `PATCH /api/addresses/:id` (direcciones del cliente autenticado); `GET /api/cart`, `POST /api/cart/add` y `DELETE /api/cart/remove/:productId`; `GET/POST /api/users` (solo Administrador, lista y creación de personal); `GET /api/orders?page=1&limit=10&status=PENDIENTE` para paginar y filtrar pedidos. Si MockPay no responde al crear un enlace, el pedido queda pendiente y el cliente puede reintentarlo desde `Mis pedidos` con `POST /api/orders/:id/payment-link`.

La API necesita `MOCKPAY_API_URL` y `MOCKPAY_API_KEY` (o `MOCKPAY_SECRET_KEY`) para crear pagos. Para habilitar callbacks, configura también `MOCKPAY_WEBHOOK_URL` con la URL `/api/orders/webhooks/mockpay` y un `MOCKPAY_WEBHOOK_SECRET` de al menos 32 caracteres; el proveedor debe enviar ese secreto en el header `x-mockpay-secret`. El endpoint rechaza llamadas sin el secreto. Sin callback configurado, el personal puede actualizar el estado del pedido desde la cola.

---

Desarrollado por **Cristian Eugenio Claudio Feliz** | 2026
