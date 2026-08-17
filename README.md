<div align="center">

# PR Intra

**Intranet corporativa** con autenticación, mensajería en tiempo real, gestión documental y control de acceso por roles.

[![Backend](https://img.shields.io/badge/backend-Laravel%2013-FF2D20?logo=laravel&logoColor=white)](./backend)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-000?logo=next.js&logoColor=white)](./frontend)
[![Realtime](https://img.shields.io/badge/realtime-Reverb%20%2F%20Pusher-5469D4)](#-comunicaci%C3%B3n-en-tiempo-real)
[![Auth](https://img.shields.io/badge/auth-Sanctum%20(PAT)-F53B57)](#-seguridad-y-autenticaci%C3%B3n)

Monorepo con dos aplicaciones independientes que conviven en este repositorio:

| Capa            | Stack                                       | Carpeta                                |
| --------------- | ------------------------------------------- | -------------------------------------- |
| API + Realtime  | Laravel 13 · PHP 8.5 · Sanctum · Reverb     | [`backend/`](./backend)                |
| UI Web          | Next.js 16 · React 19 · TypeScript · TW 4   | [`frontend/`](./frontend)              |

</div>

---

## Arquitectura General

```
┌────────────────────────┐        HTTPS / Bearer Token        ┌──────────────────────────┐
│  Frontend (Next.js)    │ ───────────────────────────────────▶│  Backend (Laravel API)   │
│  App Router + Cliente  │                                     │  Sanctum · Reverb        │
│                        │ ◀──── WebSocket (Echo/Reverb) ──────│                          │
└────────────────────────┘                                     └────────────┬─────────────┘
                                                                              │
                                                                  ┌───────────▼───────────┐
                                                                  │  Base de datos (Eloquent)
                                                                  └───────────────────────┘
```

El frontend consume la API REST mediante un cliente único (`lib/api-client.ts`) que centraliza headers y manejo de errores, y mantiene una conexión WebSocket paralela para los eventos en tiempo real.

---

## Backend — Laravel 13

Diseñado siguiendo el patrón MVC clásico de Laravel con capas bien delimitadas y responsabilidades únicas.

### Capas

- **HTTP** — `app/Http/Controllers/Api` recibe peticiones, delega validación a *Form Requests* y orquesta respuestas con API Resources.
- **Dominio** — `app/Models` define las entidades de negocio como modelos Eloquent con relaciones tipadas.
- **Persistencia** — `database/migrations` define el esquema relacional completo (usuarios, roles, departamentos, conversaciones, mensajes, anuncios, documentos, comentarios, etc.).
- **Autorización** — `app/Policies` aplica reglas de acceso por rol/departamento (p. ej. `AnnouncementPolicy`).
- **Tiempo real** — `app/Events` + `routes/channels.php` emiten y autorizan eventos por canal privado.

### Módulos funcionales

| Módulo                    | Modelos principales                                                       | Endpoints                                                   |
| ------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Identidad y permisos      | `User`, `Role`, `Department`, `DepartmentFolder`                          | `AuthController`, `UserController`, `RoleController`, ...   |
| Comunicación interna      | `Conversation`, `Message`, `MessageRead`                                  | `ConversationController`, `MessageController`               |
| Contenido interno         | `Announcement`, `AnnouncementAttachment`, `Comment`, `Document`           | `AnnouncementController`, `DocumentController`, `Comment...`|

### Comunicación en tiempo real

- Eventos definidos en `app/Events/MessageSent.php`.
- Canales privados en `routes/channels.php` (formato `conversations.{conversationId}`).
- Broadcasting sobre **Laravel Reverb** (preferido) o **Pusher** (compatibilidad).
- El frontend escucha los canales mediante `laravel-echo` (`lib/echo-client.ts`).

### Seguridad y autenticación

- **Laravel Sanctum v4** con *Personal Access Tokens* (`personal_access_tokens`).
- Token entregado en `POST /api/login` y enviado como `Authorization: Bearer <token>`.
- Autorización declarativa con **Policies** y middleware en rutas.
- Hash de contraseñas con `bcrypt` y verificación por *Form Requests*.

---

## Frontend — Next.js 16 (App Router)

Arquitectura basada en **App Router**, con rutas agrupadas por dominio funcional y capa de servicios compartidos para API y realtime.

### Capas

- **Rutas (App Router)** — `app/` con grupos `dashboard/*` por dominio (conversations, documents, publications, departments, users, roles).
- **Componentes** — `components/` con piezas reutilizables (sidebar, ui compartidos).
- **Servicios** — `lib/` abstrae las integraciones externas:
  - `api-client.ts` → cliente HTTP único con manejo estandarizado de errores y `401` → logout.
  - `auth-token.ts` → almacenamiento del token (`localStorage` si "recordar sesión", `sessionStorage` en caso contrario).
  - `echo-client.ts` → inicialización de Laravel Echo con Reverb o Pusher.

### Estructura funcional

```
app/
├── page.tsx                  # Login contra POST /login + validación con GET /me
└── dashboard/
    ├── page.tsx              # Resumen (conversaciones + publicaciones)
    ├── conversations/        # Chat + adjuntos en tiempo real
    ├── documents/            # Gestión/consulta de documentos
    ├── publications/         # Anuncios según permisos
    ├── departments/          # Admin: departamentos y roles por departamento
    └── users/                # Admin: gestión de usuarios
```

### Integración con el Backend

- URL base configurable vía `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8000/api`).
- Rewrite local en `next.config.ts` para llamadas tipo `/backend/*` durante desarrollo.
- Imágenes remotas permitidas solo para hosts de storage local (`localhost`, `127.0.0.1`).
- Contrato detallado de endpoints en [`frontend/API_NEXTJS.md`](./frontend/API_NEXTJS.md) y [`backend/API_NEXTJS.md`](./backend/API_NEXTJS.md).

---

## Requisitos Previos

- **PHP 8.5** y **Composer** — para el backend.
- **Node.js 20+** y **pnpm** (recomendado) — para el frontend.
- Un servidor de base de datos compatible con Laravel.
- Una instancia de **Reverb** o **Pusher** configurada si vas a usar mensajería en tiempo real.

> Para un entorno local funcional, primero levanta el backend y después el frontend.

---

## Instalación y Ejecución

Las instrucciones detalladas (comandos, variables de entorno, seeders, etc.) se encuentran en el README de cada subproyecto:

- Backend → [backend/README.md](./backend/README.md)
- Frontend → [frontend/README.md](./frontend/README.md)

---

## Roadmap / Ideas

- Notificaciones push para anuncios y mensajes.
- Búsqueda global (usuarios, documentos, mensajes).
- Auditoría y logs de actividad por usuario.
- Versionado público de la API (`/api/v1`, `/api/v2`).
- Tests E2E del flujo de conversación en tiempo real.

---

## Licencia

Proyecto privado / de práctica. Uso interno.
