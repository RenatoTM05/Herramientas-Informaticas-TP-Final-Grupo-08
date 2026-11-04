# Proyecto Final - Grupo 08

## Descripción

Aplicación web desarrollada como proyecto final, compuesta por un frontend y un backend que se comunican para ofrecer las funcionalidades del sistema.

## Tecnologías utilizadas

**Frontend**
- Angular
- TypeScript
- HTML y CSS

**Backend**
- Node.js
- Express
- Sequelize
- PostgreSQL
- Autenticación mediante Google OAuth

## Estructura del proyecto

```text
proyecto-final-grupo-08/
├── frontend/       # Aplicación frontend
├── backend/        # Servidor y lógica del backend
└── README.md       # Documentación general
```

## Requisitos

Para ejecutar el proyecto localmente se necesita:

- Node.js y npm.
- PostgreSQL.
- Una base de datos configurada para el backend.
- Credenciales de Google OAuth e IGDB.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd proyecto-final-grupo-08
```

### 2. Configurar el backend

Ingresar a la carpeta:

```bash
cd backend
```

Instalar las dependencias:

```bash
npm install
```

Crear un archivo `.env` tomando como referencia el archivo `.env.example` y completar las variables de entorno necesarias.

### Crear la base de datos

Antes de iniciar el backend, es necesario crear una base de datos en PostgreSQL.

Desde pgAdmin:

1. Conectarse al servidor PostgreSQL.
2. Hacer clic derecho sobre **Databases** → **Create** → **Database**.
3. Asignarle el nombre `tpfinalbackend`.
4. Guardar los cambios.

El nombre debe coincidir con el valor de `DB_NAME` definido en el archivo `.env`.

**Nota:** Las tablas se crean automáticamente al iniciar el backend mediante Sequelize.

Verificar que PostgreSQL esté funcionando y que exista la base de datos configurada en `DB_NAME`.

Iniciar el servidor:

```bash
npm run dev
```

El backend se ejecuta en el puerto `3000`.

### 3. Configurar el frontend

En otra terminal, ingresar a la carpeta del frontend:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install --legacy-peer-deps
```

Iniciar la aplicación:

```bash
npm start
```

El frontend estará disponible en:

http://localhost:4200/

---

**Nota:** Las dependencias deben instalarse por separado en las carpetas `frontend` y `backend`. No es necesario instalar dependencias en la raíz del repositorio.