# Contexto del proyecto, alcance y roadmap

## 1. Idea del producto

El proyecto es un **MVP full stack para gestión de talleres mecánicos**.

La idea nace de una necesidad concreta del rubro:

> Los talleres suelen manejar información dispersa entre WhatsApp, papel, memoria del mecánico, fotos sueltas y presupuestos informales.

El objetivo es crear una herramienta moderna que centralice la operación diaria del taller.

---

## 2. Definición del MVP

El MVP final viable en un mes debe permitir que el usuario pueda:

```txt
1. Iniciar sesión.
2. Ver un dashboard operativo.
3. Crear clientes.
4. Crear vehículos asociados a clientes.
5. Crear órdenes de trabajo asociadas a vehículos.
6. Cambiar el estado de una orden.
7. Abrir una ficha del vehículo.
8. Navegar entre Cliente / Vehículo / Órdenes / Historial.
9. Buscar por patente, cliente o teléfono.
10. Ver historial básico de trabajos anteriores.
```

Ese es el alcance principal. Nada más debería entrar en la primera versión salvo que sobre tiempo.

---

## 3. Concepto central: Ficha del vehículo

La entidad funcional principal será la **Ficha del vehículo**.

No se quiere una app donde clientes, vehículos y órdenes estén completamente desconectados.

La lógica correcta es:

```txt
Cliente
└── Vehículos
    └── Órdenes de trabajo
```

La ficha del vehículo debe permitir navegar entre:

```txt
Resumen
Cliente
Vehículo
Órdenes
Historial
```

Esta pantalla será el corazón del producto.

---

## 4. Problema que resuelve

El MVP debe ayudar al taller a responder rápido:

- ¿Qué autos hay en el taller?
- ¿En qué estado está cada trabajo?
- ¿Quién es el cliente?
- ¿Cuál es el teléfono del cliente?
- ¿Qué problema reportó?
- ¿Qué diagnóstico tiene?
- ¿Qué tareas se realizaron?
- ¿Qué trabajos anteriores tiene este vehículo?
- ¿Qué falta para entregarlo?

Si el sistema responde esto de forma clara, el MVP está bien enfocado.

---

## 5. Alcance incluido

### Incluido en MVP

```txt
Login
Dashboard operativo
Clientes
Vehículos
Órdenes de trabajo
Ficha del vehículo
Historial básico
Búsqueda por patente / cliente / teléfono
Estados de orden
```

### Estados mínimos de orden

```txt
PENDING
IN_PROGRESS
READY
DELIVERED
```

Estos estados son suficientes para una primera versión.

---

## 6. Fuera de alcance para el mes 1

No incluir todavía:

```txt
Stock
Facturación
Caja
Proveedores
WhatsApp API
Fotos
PDFs
Turnos
Portal cliente
Multi-sucursal visual
Reportes avanzados
Permisos complejos
Recuperación de contraseña
Registro público
Pagos online
Firma digital
IA
```

Estas features pueden ser valiosas, pero no pertenecen al MVP inicial.

---

## 7. Stack elegido

### Monorepo

```txt
Turborepo
pnpm workspaces
```

### Frontend

```txt
Next.js App Router
React
TypeScript
Tailwind CSS v4
```

### Backend

```txt
NestJS
TypeScript
Prisma
PostgreSQL
```

### Infra local

```txt
Docker Desktop
Docker Compose
```

---

## 8. Por qué se eligió esta arquitectura

Se eligió frontend y backend separados porque el objetivo es construir un proyecto **full stack real**.

Ventajas:

- Mejor separación de responsabilidades.
- Backend profesional y modular.
- API REST clara.
- Base de datos real.
- Migraciones reales.
- Mejor valor para portfolio.
- Más cerca de un producto vendible.
- Permite escalar sin reescribir desde cero.

---

## 9. Estrategia de escalabilidad

La escalabilidad no se está resolviendo con microservicios ni sobreingeniería.

Se está resolviendo con buenas decisiones tempranas:

### 1. Monorepo ordenado

```txt
apps/web
apps/api
packages/contracts
```

### 2. Backend modular

```txt
auth
customers
vehicles
work-orders
dashboard
```

### 3. Multi-tenant desde base de datos

Todas las entidades operativas importantes tienen:

```txt
workshopId
```

Esto permite que en el futuro varios talleres usen la misma app.

### 4. API versionada

```txt
/api/v1
```

### 5. Prisma + migraciones

La evolución de la base queda controlada por migraciones.

### 6. Contratos compartidos preparados

`packages/contracts` queda disponible para tipos, DTOs o schemas compartidos.

---

## 10. Modelo de datos actual

Tablas principales:

```txt
Workshop
User
WorkshopMember
Customer
Vehicle
WorkOrder
```

Relaciones:

```txt
Workshop 1 ──── N Customer
Workshop 1 ──── N Vehicle
Workshop 1 ──── N WorkOrder

Customer 1 ──── N Vehicle
Vehicle  1 ──── N WorkOrder

User N ──── N Workshop mediante WorkshopMember
```

Roles iniciales:

```txt
OWNER
ADMIN
OPERATOR
```

Aunque el MVP use solo un usuario demo, la estructura queda preparada para roles reales.

---

## 11. Estado actual

Ya está hecho:

```txt
Repositorio creado y publicado en GitHub
Monorepo con Turbo y pnpm
Frontend Next.js funcionando
Backend NestJS funcionando
Docker Compose configurado
PostgreSQL local funcionando
Prisma instalado
Schema inicial creado
Primera migración aplicada
Prisma Client generado
PrismaModule y PrismaService agregados
Seed inicial creado
Prisma Studio validado con datos reales
```

Datos del seed:

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

---

## 12. Próximo bloque recomendado

El siguiente paso debe ser construir el primer CRUD real del backend.

Orden recomendado:

```txt
1. CustomersModule
2. VehiclesModule
3. WorkOrdersModule
4. VehicleProfile endpoint
5. DashboardSummary endpoint
6. Auth real
7. Frontend dashboard
8. Frontend CRUDs
9. Ficha del vehículo
```

---

## 13. Endpoints pendientes

### Customers

```txt
GET    /api/v1/customers
GET    /api/v1/customers/:id
POST   /api/v1/customers
PATCH  /api/v1/customers/:id
```

### Vehicles

```txt
GET    /api/v1/vehicles
GET    /api/v1/vehicles/:id
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id
GET    /api/v1/vehicles/:id/profile
```

### WorkOrders

```txt
GET    /api/v1/work-orders
GET    /api/v1/work-orders/:id
POST   /api/v1/work-orders
PATCH  /api/v1/work-orders/:id
PATCH  /api/v1/work-orders/:id/status
```

### Dashboard

```txt
GET /api/v1/dashboard/summary
```

### Auth

```txt
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

## 14. Endpoint clave del producto

El endpoint más importante será:

```txt
GET /api/v1/vehicles/:id/profile
```

Debe devolver:

```txt
vehicle
customer
activeWorkOrders
history
currentStatus
```

Este endpoint alimentará la **Ficha del vehículo** en el frontend.

---

## 15. Regla crítica de seguridad futura

Cada query operativa debe filtrar por:

```txt
workshopId
```

No alcanza con buscar por `id`.

Ejemplo correcto:

```txt
Buscar vehículo por id + workshopId
```

Esto evita que un usuario de un taller pueda acceder a datos de otro taller cuando exista auth real.

Mientras no haya auth, se puede usar un `DEMO_WORKSHOP_ID` temporal.

---

## 16. Roadmap de desarrollo

### Fase 1 — Backend base

```txt
CustomersModule
VehiclesModule
WorkOrdersModule
DashboardModule
AuthModule
```

### Fase 2 — Frontend base

```txt
Layout privado
Login
Dashboard
Listado de clientes
Listado de vehículos
Listado de órdenes
```

### Fase 3 — Ficha del vehículo

```txt
Header de ficha
Tabs internas
Resumen
Cliente
Vehículo
Órdenes
Historial
Crear orden desde ficha
Cambiar estado de orden
```

### Fase 4 — Polish MVP

```txt
Loading states
Error states
Empty states
Responsive
Validaciones
README
Screenshots
Deploy
```

---

## 17. Criterio de éxito

El MVP está logrado si una demo puede mostrar este flujo:

```txt
1. Iniciar sesión.
2. Ver dashboard operativo.
3. Buscar un vehículo por patente.
4. Abrir la ficha del vehículo.
5. Ver cliente asociado.
6. Ver historial.
7. Crear una nueva orden.
8. Cambiar estado de la orden.
9. Ver el cambio reflejado en dashboard/ficha.
```

Ese flujo demuestra el valor central del producto.

---

## 18. Principio rector

No estamos construyendo un ERP.

Estamos construyendo:

> Una app operativa para que un taller pueda centralizar clientes, vehículos, órdenes de trabajo e historial en una ficha navegable del vehículo.

Todo lo que no fortalezca ese flujo debe esperar.
