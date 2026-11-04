# Proyfrontendgrupo10

## 1) Descripción general

Esta aplicación es un frontend construido con Angular (componentes standalone) orientado a un catálogo gamer.  
Incluye:

- listado y búsqueda de juegos
- detalle de juego
- autenticación (login/registro + callback OAuth)
- pagos con Mercado Pago (flujo frontend + confirmación en backend)
- dashboard administrativo con métricas, gráficos y exportación (Excel/PDF)

El frontend consume un backend local en `http://localhost:3000`.

## 2) Tecnologías principales

- **Angular 21** (standalone components, router, HttpClient, forms reactivas)
- **RxJS** (debounce y flujos reactivos)
- **Bootstrap 5 + Bootstrap Icons**
- **SweetAlert2** (notificaciones UI)
- **Chart.js + ng2-charts** (gráficos en dashboard)
- **xlsx** y **jsPDF + jspdf-autotable** (exportaciones)
- **Vitest** (tests)

## 3) Requisitos previos

- Node.js y npm
- Angular CLI (opcional global)
- Backend del proyecto corriendo en `http://localhost:3000`

## 4) Instalación y ejecución

```bash
npm install
npm start
```

La app queda disponible en `http://localhost:4200`.

### Scripts disponibles

```bash
npm start        # ng serve
npm run build    # build de producción
npm run watch    # build en modo watch (development)
npm test         # tests unitarios
```

## 5) Arquitectura de la aplicación

### 5.1 Estructura base

El proyecto usa componentes standalone (sin NgModule principal), configurados desde:

- `src/main.ts`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`

### 5.2 Layout principal

- `App` (`src/app/app.ts`) monta:
  - `Navbar` (`src/app/layout/navbar/navbar.ts`)
  - `RouterOutlet` para renderizar páginas según ruta

### 5.3 Ruteo

Definido en `src/app/app.routes.ts`:

- `/` → `HomeComponent`
- `/Login` → `LoginComponent`
- `/oauth-callback` → `OuathCallback`
- `/Registro` → `RegistroComponent`
- `/pago-exitoso` → `PagoExitosoComponent`
- `/Resultados/:termino` → `ResultadosComponent`
- `/JuegoDetalle/:id` → `JuegoDetalle`
- `/juego/:id` → `JuegoDetalle` (alias)
- `/Admin` → `Dashboard`
- `**` → redirección a `/`

> Nota: las rutas están definidas con mayúsculas en varios casos (`/Login`, `/Registro`, `/Admin`, etc.).

## 6) Autenticación y seguridad de requests

### 6.1 Servicio de autenticación

Archivo: `src/app/services/auth.service.ts`

Endpoints usados:

- `POST http://localhost:3000/api/login/loginUser` (login)
- `POST http://localhost:3000/api/login/` (registro)

### 6.2 Token JWT

- Se guarda en `localStorage` bajo la clave `token`.
- Se usa para estado de sesión en navbar y para permisos de acciones protegidas.

### 6.3 Interceptor HTTP

En `src/app/app.config.ts` se registra un interceptor que:

- toma el `token` desde `localStorage`
- agrega el encabezado `Authorization` con el token tipo ****** las peticiones HTTP

## 7) Módulos funcionales (páginas)

### 7.1 Home (`src/app/pages/home`)

Responsabilidades:

- cargar catálogo general y destacados
- buscador con sugerencias (debounce 200ms)
- navegación a detalle de juego
- sección premium con flujo de compra

Servicios usados:

- `JuegosService`
- `PagoService`

### 7.2 Login (`src/app/pages/login`)

Incluye:

- formulario reactivo (usuario y contraseña)
- login tradicional contra backend
- login con Google redirigiendo a `http://localhost:3000/api/auth/google`
- feedback visual con SweetAlert2

### 7.3 Registro (`src/app/pages/registro`)

Incluye:

- formulario reactivo con validaciones
- selección de avatar
- alta de usuario vía backend

### 7.4 OAuth Callback (`src/app/pages/ouath-callback`)

Función:

- leer `token` de query params
- guardar token en `localStorage`
- redirigir a home o login según resultado

### 7.5 Resultados (`src/app/pages/resultados`)

Función:

- tomar `:termino` desde URL
- buscar sugerencias/juegos y mostrarlos
- ordenar por fecha de lanzamiento (más nuevo primero)

### 7.6 Juego Detalle (`src/app/pages/juego-detalle`)

Función:

- cargar detalle por `id`
- mostrar estado de carga/error
- renderizar trailer de YouTube de forma segura (`DomSanitizer`)

### 7.7 Pago Exitoso (`src/app/pages/pago-exitoso`)

Función:

- leer `payment_id` y `status` desde query params
- si está aprobado, confirmar compra en backend
- remover `juego_pendiente` de `sessionStorage` al confirmar

### 7.8 Dashboard Admin (`src/app/pages/dashboard`)

Incluye:

- métricas generales
- gráficos (línea, torta, barras)
- tabla de auditoría con búsqueda y paginación
- exportación de auditoría en Excel y PDF

Servicio usado:

- `DashboardService`

## 8) Servicios y contratos HTTP

### 8.1 JuegosService (`src/app/services/juegos.service.ts`)

- `GET /juego/` → catálogo general
- `GET /juego/mas-jugados` → juegos destacados/mas jugados
- `GET /juego/sugerencias/:nombre` → sugerencias de búsqueda
- `GET /juego/detalle/:id` → detalle de juego

### 8.2 PagoService (`src/app/services/pago.ts`)

- `POST /api/pagos/crear-preferencia` → crea preferencia de pago
- `POST /api/pagos/confirmar-compra` → persiste compra aprobada

### 8.3 DashboardService (`src/app/services/dashboard.service.ts`)

Base: `/api/dashboard` (requiere token)

- `/metricas`
- `/logins-por-dia`
- `/acciones-por-tipo`
- `/usuarios-activos`
- `/auditoria?pagina=&limite=&busqueda=`
- `/juegos-buscados`

## 9) Estructura de carpetas (resumen)

```text
src/
  app/
    app.config.ts
    app.routes.ts
    layout/
      navbar/
    pages/
      home/
      login/
      registro/
      resultados/
      juego-detalle/
      ouath-callback/
      pago-exitoso/
      dashboard/
    services/
      auth.service.ts
      juegos.service.ts
      pago.ts
      dashboard.service.ts
```

