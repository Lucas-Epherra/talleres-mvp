# Resumen técnico del setup inicial

## Proyecto

**Nombre:** Talleres MVP  
**Objetivo:** construir una aplicación full stack para gestión operativa de talleres mecánicos.

El MVP busca centralizar **clientes**, **vehículos**, **órdenes de trabajo**, **historial básico por vehículo** y un **dashboard operativo**.

La entidad funcional más importante del producto será la **Ficha del vehículo**, desde donde se podrá navegar entre cliente, vehículo, órdenes e historial.

---

## 1. Decisión de arquitectura

Se eligió el **Camino B**:

```txt
Frontend real + Backend real + Base de datos real
```

Stack seleccionado:

```txt
Monorepo: Turborepo + pnpm workspaces

Frontend:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4

Backend:
- NestJS
- TypeScript
- Prisma
- PostgreSQL

Infra local:
- Docker Desktop
- Docker Compose
```

La decisión principal fue construir un backend separado con NestJS para que el proyecto tenga una arquitectura full stack real, escalable y más sólida para portfolio/producto.

---

## 2. Estructura del monorepo

Se creó un monorepo con esta estructura base:

```txt
talleres-mvp/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── contracts/
│       └── src/
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── .gitignore
```

### Responsabilidades

```txt
apps/web
```

Frontend Next.js.

```txt
apps/api
```

Backend NestJS.

```txt
packages/contracts
```

Espacio reservado para contratos compartidos, DTOs o tipos comunes entre frontend y backend.

---

## 3. Configuración de pnpm y Turbo

Se configuró `pnpm` como package manager del monorepo.

Archivo principal:

```txt
pnpm-workspace.yaml
```

Con workspaces para:

```txt
apps/*
packages/*
```

También se configuró:

```txt
turbo.json
```

Para ejecutar tareas compartidas:

```txt
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

El objetivo es poder levantar frontend y backend juntos desde la raíz del repo.

---

## 4. Frontend configurado

Se creó la aplicación Next.js en:

```txt
apps/web
```

Con:

- App Router.
- TypeScript.
- Tailwind CSS.
- ESLint.
- `src/` directory.
- Alias de imports `@/*`.

Se validó que el frontend levante correctamente en:

```txt
http://localhost:3000
```

---

## 5. Backend configurado

Se creó la aplicación NestJS en:

```txt
apps/api
```

Se configuró para correr en:

```txt
http://localhost:3001
```

Y se estableció el prefijo global:

```txt
/api/v1
```

Endpoint inicial validado:

```txt
GET http://localhost:3001/api/v1
```

Respuesta:

```txt
Hello World!
```

---

## 6. Docker y PostgreSQL

Se creó un archivo:

```txt
docker-compose.yml
```

Para levantar PostgreSQL local con Docker.

Servicio configurado:

```txt
postgres:16-alpine
```

Credenciales locales:

```txt
POSTGRES_USER=talleres_user
POSTGRES_PASSWORD=talleres_password
POSTGRES_DB=talleres_mvp
```

Puerto expuesto:

```txt
5432:5432
```

Contenedor validado:

```txt
talleres_mvp_postgres
```

Estado validado:

```txt
healthy
```

---

## 7. Prisma configurado

Se instaló Prisma en el backend:

```txt
@prisma/client
prisma
tsx
```

Se creó:

```txt
apps/api/prisma/schema.prisma
```

Se ejecutó la primera migración:

```txt
prisma migrate dev --name init
```

Y se generó Prisma Client.

---

## 8. Modelo de datos inicial

El modelo quedó preparado para un producto escalable y multi-tenant.

Tablas principales:

```txt
workshops
users
workshop_members
customers
vehicles
work_orders
```

### Relación operativa

```txt
Workshop 1 ──── N Customer
Workshop 1 ──── N Vehicle
Workshop 1 ──── N WorkOrder

Customer 1 ──── N Vehicle
Vehicle  1 ──── N WorkOrder

User N ──── N Workshop mediante WorkshopMember
```

---

## 9. Decisión multi-tenant desde el inicio

Aunque el MVP se use con un solo taller, se incluyó:

```txt
workshopId
```

En entidades operativas:

- Customer.
- Vehicle.
- WorkOrder.

Esto evita reescribir la base si en el futuro el producto se convierte en SaaS para múltiples talleres.

---

## 10. PrismaModule y PrismaService

Se creó la integración de Prisma con NestJS:

```txt
apps/api/src/prisma/prisma.service.ts
apps/api/src/prisma/prisma.module.ts
```

El servicio encapsula `PrismaClient` y queda disponible globalmente mediante `PrismaModule`.

Esto evita instanciar Prisma manualmente en cada módulo.

---

## 11. Seed inicial

Se creó un seed en:

```txt
apps/api/prisma/seed.ts
```

Datos cargados:

```txt
Workshop: 1
User: 1
WorkshopMember: 1
Customer: 2
Vehicle: 3
WorkOrder: 4
```

Credenciales demo:

```txt
Email: admin@taller.demo
Password: Admin123!
```

El seed se validó visualmente con Prisma Studio en:

```txt
http://localhost:5555
```

---

## 12. Estado actual del proyecto

El proyecto ya tiene:

- Monorepo configurado.
- Frontend Next.js funcionando.
- Backend NestJS funcionando.
- PostgreSQL local funcionando con Docker.
- Prisma configurado.
- Migración inicial aplicada.
- Seed inicial cargado.
- Prisma Studio mostrando datos reales.
- Repositorio publicado en GitHub.

El proyecto ya está listo para avanzar con los primeros módulos reales del backend.

---

## 13. Siguiente paso técnico

El siguiente bloque recomendado es crear el módulo:

```txt
CustomersModule
```

Endpoints mínimos:

```txt
GET    /api/v1/customers
GET    /api/v1/customers/:id
POST   /api/v1/customers
PATCH  /api/v1/customers/:id
```

Este será el primer CRUD real del sistema.

---

## 14. Reglas técnicas adoptadas

- Mantener backend modular.
- No usar Supabase.
- Usar PostgreSQL real.
- Usar Prisma para migraciones y acceso a datos.
- Usar `workshopId` desde el inicio.
- Evitar sobreingeniería.
- Evitar features fuera del MVP.
- Priorizar estructura escalable y clara.
- Hacer commits por bloque funcional.
