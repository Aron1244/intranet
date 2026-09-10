# BACKLOG — PR-Intra (renombrar a Coherev)

> Backlog vivo del proyecto. Cada tarjeta representa una unidad de trabajo para el tablero Kanban (Trello).
> Numeración: **SEC** = Seguridad, **ROL** = Roles, **DOC** = Documentación, **BRAND** = Rebranding a Coherev, **UX** = Polish técnico.

---

## Convenciones

- **Estado Trello** (columna inicial de cada tarjeta):
  - `Backlog` → identificada pero no priorizada para el ciclo actual
  - `Por hacer` → priorizada, lista para tomar
  - `En curso` → trabajo activo
  - `En revisión` → funcional, esperando validación
  - `Hecho` → terminada y verificada

- **Prioridad**: 🔴 Alta · 🟡 Media · 🟢 Baja

- **Estimación**: `S` ≤ 3h · `M` 3-8h · `L` > 8h

- **Observación**: número de punto del feedback de Cindy Betzabé Contador Cisterna (cuando aplique).

---

## Estado actual del backlog

| Grupo | Tarjetas | Estado Trello |
|---|---|---|
| Seguridad | `SEC-001` … `SEC-007` | ✅ Movidas (por el equipo) |
| Roles | `ROL-001` … `ROL-003` | ✅ Movidas (por el equipo) |
| Documentación | `DOC-001` … `DOC-005` | ✅ Movidas (por el equipo) |
| Rebranding Coherev | `BRAND-001` … `BRAND-010` | 🟡 Pendiente de subir |
| UX técnico | `UX-001` … `UX-004` | 🟡 Pendiente de subir |

---

## 🔴 Seguridad (SEC-*)

### SEC-001 · Rate-limit en login
- **Módulo**: Auth
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **Observación**: 15 (seguridad)
- **AC**:
  - Throttle 5 intentos/min por IP+email
  - Respuesta 429 con mensaje claro
- **Archivos sugeridos**: `backend/routes/api.php`, `backend/app/Http/Requests/LoginRequest.php`

### SEC-002 · Autorización en UserController (solo admin)
- **Módulo**: Usuarios
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **Observación**: 3 + 15
- **AC**:
  - Middleware `admin` en `apiResource('users', …)`
  - Solo admin ve/crea/edita/elimina usuarios
  - Usuario autenticado no-admin recibe 403
- **Archivos**: `backend/routes/api.php`, `backend/app/Http/Controllers/Api/UserController.php`

### SEC-003 · Autorización en DepartmentController (solo admin)
- **Módulo**: Departamentos
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **Observación**: 3 + 15
- **AC**:
  - Middleware `admin` en `apiResource('departments', …)`
  - Líderes pueden ver pero no eliminar
- **Archivos**: `backend/routes/api.php`, `backend/app/Http/Controllers/Api/DepartmentController.php`

### SEC-004 · Autorización en RoleController (solo admin)
- **Módulo**: Roles
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **Observación**: 3 + 15
- **AC**:
  - Middleware `admin` en `apiResource('roles', …)`
  - Lectura: abierta para autenticados
- **Archivos**: `backend/routes/api.php`, `backend/app/Http/Controllers/Api/RoleController.php`

### SEC-005 · Autorización en DocumentController (escritura admin o dueño)
- **Módulo**: Documentos
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **Observación**: 15
- **AC**:
  - Filtro de lectura ya existe, mantenerlo
  - Subir/borrar: solo admin o `user_id == auth()->id()`
- **Archivos**: `backend/app/Http/Controllers/Api/DocumentController.php`, `backend/app/Policies/` (nuevo `DocumentPolicy`)

### SEC-006 · Validar MIME real en uploads
- **Módulo**: Documentos / Comunicados / Chat
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **Observación**: 15
- **AC**:
  - Usar `File::mimes()` o `guessExtension()` en Form Requests
  - Rechazo 415 si MIME no coincide con la extensión
- **Archivos**: `backend/app/Http/Requests/StoreDocumentRequest.php`, `StoreAnnouncementRequest.php`, `backend/app/Http/Controllers/Api/MessageController.php`

### SEC-007 · Conectar `MessageRead` (tabla existe, sin uso)
- **Módulo**: Chat
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 15 (auditoría/trazabilidad)
- **AC**:
  - Al abrir conversación se registra `MessageRead`
  - Contador de no leídos viene de la tabla, no de `sessionStorage`
- **Archivos**: `backend/app/Models/MessageRead.php` (crear), `backend/app/Http/Controllers/Api/MessageController.php`, `frontend/app/dashboard/conversations/page.tsx`

---

## 🔴 Roles (ROL-*)

### ROL-001 · Modelar los 4 roles (Administrador, Líder, Colaborador, Nuevo Ingreso)
- **Módulo**: Auth/Roles
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **Observación**: 3
- **AC**:
  - Seeder con esos 4 roles
  - Permisos por rol en tabla o Policy
  - Migración: agregar flag `es_lider`, `onboarding_pendiente` a `users`
- **Archivos**: `backend/database/seeders/RoleSeeder.php` (nuevo), `backend/database/migrations/*`

### ROL-002 · Refactor `User::canManageAnnouncements()`
- **Módulo**: Auth
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **Observación**: 3
- **AC**:
  - Método centralizado por rol (`hasRole('Administrador') || hasRole('Líder')`)
  - Tests que cubran los 4 roles
- **Archivos**: `backend/app/Models/User.php`, `backend/tests/Feature/`

### ROL-003 · Sidebar y rutas según los 4 roles
- **Módulo**: Frontend
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **Observación**: 3 + 5
- **AC**:
  - Nuevo ingreso ve Panel de Novedades destacado
  - Líder ve módulo Tareas
  - Colaborador ve solo lectura + chat + documentos
  - Admin ve todo
- **Archivos**: `frontend/components/dashboard-sidebar.tsx`, `frontend/app/dashboard/**/page.tsx`, `frontend/middleware.ts` (si se crea)

---

## 🟡 Documentación (DOC-*)

### DOC-001 · Diagrama de arquitectura
- **Módulo**: Docs
- **Prioridad**: 🟡 Media · **Estimación**: S
- **Observación**: 7
- **AC**:
  - Archivo `docs/ARCHITECTURE.md` o imagen
  - Muestra Next.js, Laravel, Sanctum, Reverb, MariaDB
  - Flujos de auth + realtime
- **Archivos**: `docs/ARCHITECTURE.md` (nuevo)

### DOC-002 · Diagrama ER de la BD
- **Módulo**: Docs
- **Prioridad**: 🟡 Media · **Estimación**: S
- **Observación**: 8
- **AC**:
  - `docs/DATABASE.md` con diagrama (Mermaid o imagen)
  - Tablas: `users`, `roles`, `user_roles`, `departments`, `department_folders`, `conversations`, `conversation_user`, `messages`, `message_reads`, `announcements`, `announcement_attachments`, `comments`, `documents`, `personal_access_tokens`
- **Archivos**: `docs/DATABASE.md` (nuevo)

### DOC-003 · Documento de RF y RNF
- **Módulo**: Docs
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 2
- **AC**:
  - `docs/REQUIREMENTS.md`
  - RF-001 … RF-NN numerados por módulo
  - RNF: rendimiento, seguridad, usabilidad, mantenibilidad
- **Archivos**: `docs/REQUIREMENTS.md` (nuevo)

### DOC-004 · Historias de usuario
- **Módulo**: Docs
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 6
- **AC**:
  - `docs/USER_STORIES.md`
  - Formato: Como… quiero… para…
  - Al menos 12 historias (3 por rol)
  - Cada HU referencia un RF
- **Archivos**: `docs/USER_STORIES.md` (nuevo)

### DOC-005 · Matriz de trazabilidad
- **Módulo**: Docs
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 14
- **AC**:
  - `docs/TRACEABILITY.md` (tabla markdown)
  - Une el problema de la PPT con cada RF y HU
  - Referencia al test PHPUnit que valida
- **Archivos**: `docs/TRACEABILITY.md` (nuevo)

---

## 🎨 Rebranding a Coherev (BRAND-*)

> Paleta actual se mantiene (`intra-primary`, `intra-accent`, `intra-secondary`, `intra-ligth`, `intra-border`). Solo cambia naming semántico y assets de marca.

### BRAND-001 · Wordmark + isotipo + tagline Coherev
- **Módulo**: Identidad
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **AC**:
  - Wordmark "Coherev" en SVG/PNG (variantes light/dark si aplica)
  - Isotipo cuadrado para favicon y sidebar colapsado
  - Tagline corto propuesto (ej: "Conecta. Coherencia. Equipo.")
  - Guía rápida: uso mínimo, clear space, no rotar
- **Archivos**: `frontend/public/brand/*` (nuevo)

### BRAND-002 · Refinar tokens CSS (mantener paleta actual)
- **Módulo**: Design tokens
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **AC**:
  - Mantener valores hex actuales (`intra-primary`, `intra-accent`, etc.)
  - Renombrar a semántica de marca: `--brand-primary`, `--brand-accent`…
  - `tailwind.config`: mapear a nuevas utility names (`brand-*`)
  - Alias retrocompatible para no romper todo de golpe
- **Archivos**: `frontend/tailwind.config.*`, `frontend/app/globals.css`

### BRAND-003 · Rebranding del login
- **Módulo**: Auth UI
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **AC**:
  - Reemplazar pill "Intranet Corporativa" por wordmark Coherev
  - Hero h1: usar tagline de marca (no genérico)
  - Reescribir 3 cards del hero (24/7, +40 módulos, 100%) con datos reales de Coherev
  - Botón: "Entrar a Coherev"
  - Footer/links coherentes (olvidé mi contraseña, etc.)
- **Archivos**: `frontend/app/page.tsx`

### BRAND-004 · Rebranding del sidebar
- **Módulo**: Navegación
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **AC**:
  - Brand-area: wordmark + isotipo + subtítulo "Panel interno"
  - Avatar con iniciales del usuario (coherev-style)
  - Pill de rol con etiqueta de marca ("admin" → "Administrador Coherev")
  - Botón logout: "Salir de Coherev"
- **Archivos**: `frontend/components/dashboard-sidebar.tsx`

### BRAND-005 · Rebranding del dashboard (Inicio)
- **Módulo**: Dashboard
- **Prioridad**: 🔴 Alta · **Estimación**: S
- **AC**:
  - Eyebrow "Coherev" + h2 con copy de marca
  - Subtitle orientado a "tu equipo en Coherev"
  - Estado API pill: mantener lógica, pulir tipografía
  - Empty state "Aún no hay publicaciones" con copy Coherev
- **Archivos**: `frontend/app/dashboard/page.tsx`

### BRAND-006 · Rebranding de páginas internas
- **Módulo**: Páginas internas
- **Prioridad**: 🔴 Alta · **Estimación**: M
- **AC**:
  - Headers h2/h3 con naming consistente ("Publicaciones Coherev", "Tu biblioteca", "Equipo", "Departamentos", "Conversaciones")
  - Botones primarios con verbo + marca ("Publicar en Coherev", "Crear usuario", etc.)
  - Empty states unificados (ver BRAND-010)
  - Toasts de éxito con tono Coherev ("Listo", "Guardado en Coherev")
- **Archivos**: `frontend/app/dashboard/{publications,documents,users,departments,conversations}/page.tsx`

### BRAND-007 · Voice & tone Coherev + microcopy
- **Módulo**: Contenido
- **Prioridad**: 🟡 Media · **Estimación**: M
- **AC**:
  - 1 página de voice & tone (cercano, profesional, conciso, sin muletillas)
  - Glosario de términos: "anuncio" → "publicación", "carpeta" → "biblioteca", etc.
  - Reescribir todos los mensajes de error 4xx/5xx visibles con tono Coherev
  - Reescribir confirmaciones destructivas (`window.confirm`)
- **Archivos**: `docs/VOICE_TONE.md` (nuevo), mensajes en cada `page.tsx`

### BRAND-008 · Onboarding tour con marca Coherev
- **Módulo**: Onboarding
- **Prioridad**: 🟡 Media · **Estimación**: S
- **AC**:
  - 5 pasos del tour reescritos con copy Coherev
  - Título y descripción del primer paso: bienvenida con marca
  - Botones: "Empezar", "Siguiente", "Finalizar recorrido"
  - CSS del popover driver.js usa tokens `brand-*`
- **Archivos**: `frontend/components/dashboard-sidebar.tsx` (`handleStartOnboarding`)

### BRAND-009 · Favicon, metadata global y 404 branded
- **Módulo**: Metadata
- **Prioridad**: 🟡 Media · **Estimación**: S
- **AC**:
  - `favicon.ico` + `apple-touch-icon` + icon-192/512 con isotipo
  - `app/layout.tsx`: `title="Coherev"`, description, theme-color, og:image
  - `app/not-found.tsx` rediseñado: ilustración simple + "Volver a Coherev"
  - Loading state global (opcional): `app/loading.tsx` con marca
  - Browser tab title dinámico por ruta
- **Archivos**: `frontend/app/layout.tsx`, `frontend/app/not-found.tsx`, `frontend/app/favicon.ico`, `frontend/public/*`

### BRAND-010 · Empty states ilustrados y consistentes
- **Módulo**: Estados vacíos
- **Prioridad**: 🟡 Media · **Estimación**: M
- **AC**:
  - Componente reutilizable `<EmptyState>` en `components/ui/`
  - Cada módulo usa el componente con copy Coherev
  - 1 ilustración SVG simple por módulo (estilo línea, mismo peso)
  - Botón CTA contextual ("Crear primera publicación", "Iniciar chat")
- **Archivos**: `frontend/components/ui/empty-state.tsx` (nuevo), uso en cada `page.tsx`

---

## 🟢 UX técnico (UX-*)

> Polish técnico independiente del rebranding. Se ejecutan tras Iteración UX-2.

### UX-001 · Sidebar móvil (drawer) con marca
- **Módulo**: Navegación responsive
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 5 (profundizar prototipos)
- **AC**:
  - `< lg`: sidebar oculto, botón hamburger topbar con isotipo Coherev
  - `aria-expanded`, `aria-controls`
  - Animación slide-in 200ms
  - Overlay cierra al click fuera / Esc
- **Archivos**: `frontend/components/dashboard-sidebar.tsx`, `app/dashboard/*/layout.tsx` (si se crea)

### UX-002 · Accesibilidad WCAG AA
- **Módulo**: a11y
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 5
- **AC**:
  - axe-core sin errores críticos
  - `aria-label` en botones solo-icono
  - Contraste verificado en todos los tokens `brand-*`
  - Focus visible en todos los interactivos
  - Navegación por teclado en chat composer
- **Archivos**: todos los `*.tsx`

### UX-003 · Errores por campo (no solo mensaje global)
- **Módulo**: Formularios
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 5
- **AC**:
  - Helper-text + `aria-invalid` por input
  - Primer foco al primer input con error tras submit
  - Usar errores del backend (Laravel 422) mapeados a cada campo
- **Archivos**: forms en `publications/`, `users/`, `departments/`, `conversations/`

### UX-004 · Vista móvil del chat mejorada
- **Módulo**: Chat mobile
- **Prioridad**: 🟡 Media · **Estimación**: M
- **Observación**: 5
- **AC**:
  - Composer fijo abajo con `safe-area-inset`
  - Teclado no tapa último mensaje (`scrollIntoView` al focus)
  - Botón "Saltar al último" visible
  - Attachment picker mobile-friendly
- **Archivos**: `frontend/app/dashboard/conversations/page.tsx`

---

## 🛣️ Roadmap (reemplaza la carta Gantt)

> Enfoque por iteraciones Kanban — sin semanas rígidas. Cada iteración termina cuando el WIP limit lo permite, no por fecha.

### Iteración 0 — Fundamentos ✅
- Setup repo, Laravel 13, Next.js 16, Sanctum, MariaDB, Reverb
- Modelos base + migraciones iniciales
- Login + me + logout
- Sidebar base con onboarding driver.js

### Iteración 1 — Seguridad 🔴 (prioridad inmediata)
- `SEC-001` → `SEC-007`
- `ROL-001` → `ROL-002`
- **Salida**: ningún endpoint sin autorización. Login con rate-limit. Modelo de roles coherente.

### Iteración 2 — Cobertura funcional 🔴
- `MOD-001` Tareas (backend + frontend)
- `MOD-002` Directorio
- `MOD-003` Panel Novedades
- `ROL-003` Sidebar por 4 roles
- **Salida**: los 7 módulos del PPT funcionan.

> Nota: `MOD-001` / `MOD-002` / `MOD-003` son los módulos faltantes identificados en la verificación. Se recomienda crear esas tarjetas en Trello al cerrar Iteración 1.

### Iteración 3 — Documentación 🟡
- `DOC-001` Arquitectura
- `DOC-002` ER
- `DOC-003` RF/RNF
- `DOC-004` Historias de usuario
- `DOC-005` Trazabilidad
- **Salida**: `docs/` completo para re-entrega PPT.

### Iteración 4 — Validación con usuarios 🟡
- Pruebas de usabilidad con N usuarios reales
- Métricas SMART (baseline + post)
- Capturas del tablero Trello real
- **Salida**: acta + métricas para observación 11 y 13.

### Iteración 5 — UX Rebranding (Coherev) 🟡
- **UX-RB1 — Identidad**: `BRAND-001`, `BRAND-002`, `BRAND-007`, `BRAND-009`
- **UX-RB2 — Pantallas**: `BRAND-003`, `BRAND-004`, `BRAND-005`, `BRAND-006`, `BRAND-008`, `BRAND-010`
- **UX-RB3 — Polish**: `UX-001`, `UX-002`, `UX-003`, `UX-004`
- **Salida**: toda la UI vistiendo Coherev, responsive, a11y AA.

### Iteración 6 — Cierre 🟡
- Corregir inconsistencia MySQL↔MariaDB en PPT
- Documentar Laravel Reverb / Pusher en stack del PPT
- Pulido final + entrega
- **Salida**: PPT actualizada + repo presentable.

---

## 📥 Sugerencia de importación a Trello

1. Crear tablero **"PR-Intra · Coherev"** con las 5 columnas: `Backlog`, `Por hacer`, `En curso`, `En revisión`, `Hecho`.
2. Por cada tarjeta de este MD, crear una card con:
   - **Título**: `ID · Nombre de la tarjeta` (ej: `SEC-002 · Autorización en UserController (solo admin)`)
   - **Descripción**: pegar el bloque "AC" + "Archivos"
   - **Label / Etiqueta**: según prioridad (🔴 Alta / 🟡 Media / 🟢 Baja)
   - **Lista inicial**: `Backlog`
3. Mover a `Por hacer` lo de **Iteración 1** (seguridad + roles) — son bloqueantes.
4. Al cerrar Iteración 1, promover Iteración 2 a `Por hacer`, etc.

---

## 📌 Notas

- Este archivo es la **fuente de verdad** del backlog. Cualquier cambio debe reflejarse aquí primero.
- Numeración: si se elimina una tarjeta, **no** se reasigna el ID (para mantener trazabilidad en commits/Trello).
- Cuando una tarjeta se complete, agregar fecha de cierre al final: `Cerrada: YYYY-MM-DD`.
