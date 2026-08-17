# PR Intra Back

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Aron1244/pr-intra-back)

Backend del proyecto construido con Laravel.

## Arquitectura del proyecto

Este proyecto está planteado como un backend para una intranet de práctica, con una arquitectura MVC propia de Laravel y separación por responsabilidades.

### Capas principales

- Capa HTTP: entrada de peticiones, controladores y validaciones (controllers y form requests).
- Capa de dominio: modelos Eloquent que representan las entidades de negocio.
- Capa de persistencia: migraciones, factories y seeders para estructura y datos base.
- Capa de tiempo real: eventos y broadcasting para mensajería interna.

### Módulos funcionales

- Usuarios y permisos: gestión de usuarios, roles y departamentos.
- Comunicación interna: conversaciones, mensajes y trazabilidad de lectura.
- Contenido interno: anuncios, comentarios y documentos.

### Estructura base

- app/Models: entidades principales de la intranet.
- app/Http/Controllers: endpoints y lógica de orquestación.
- app/Http/Requests: validación de datos de entrada.
- app/Events: eventos para comunicación en tiempo real.
- routes/: definición de rutas web, API, canales y consola.
- database/migrations: definición de tablas y relaciones.

### Flujo general

1. El cliente consume endpoints del backend.
2. El controlador delega validación y reglas de negocio.
3. Los modelos interactúan con la base de datos.
4. Cuando aplica, se disparan eventos para broadcasting.

## Instalación

Ejecuta los siguientes comandos **en este orden** (obligatorio):

1. Instalar dependencias de PHP

```bash
composer install
```

2. Instalar dependencias de Node.js

```bash
npm install
```

3. Instalar broadcasting de Laravel

```bash
php artisan install:broadcasting
```

4. Generar la clave de la aplicación

```bash
php artisan key:generate
```
5. Crear el enlace al almacenamiento público

```bash
php artisan storage:link
```

## Ejecutar en Windows

```bash
php artisan serve --no-reload --host=127.0.0.1 --port=8000
```

## Usuarios de prueba (Postman)

Puedes usar estos usuarios para probar autenticacion, roles y mensajeria:

- Admin
	- email: postman.admin@test.local
	- password: Admin123!
	- role: Admin

- Employee
	- email: postman.user@test.local
	- password: User123!
	- role: Employee

Endpoint de login:

```http
POST /api/login
```

Body ejemplo:

```json
{
	"email": "postman.admin@test.local",
	"password": "Admin123!",
	"device_name": "postman"
}
```

Comandos para crear usuarios de prueba:

```bash
php artisan tinker --execute '$role = App\Models\Role::query()->firstOrCreate(["name" => "Admin"]); $user = App\Models\User::query()->updateOrCreate(["email" => "postman.admin@test.local"], ["name" => "Postman Admin", "password" => "Admin123!"]); $user->roles()->sync([$role->id]);'
```

```bash
php artisan tinker --execute '$role = App\Models\Role::query()->firstOrCreate(["name" => "Employee"]); $user = App\Models\User::query()->updateOrCreate(["email" => "postman.user@test.local"], ["name" => "Postman User", "password" => "User123!"]); $user->roles()->sync([$role->id]);'
```

```bash
php artisan tinker --execute '$department = App\Models\Department::query()->firstOrCreate(["name" => "IT"], ["description" => "IT section"]); $role = App\Models\Role::query()->firstOrCreate(["name" => "CTO"]); $user = App\Models\User::query()->updateOrCreate(["email" => "cto@test.local"], ["name" => "CTO User", "password" => "Admin123!", "department_id" => $department->id]); $user->roles()->sync([$role->id]);'
```