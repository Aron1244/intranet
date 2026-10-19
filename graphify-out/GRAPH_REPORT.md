# Graph Report - intranet  (2026-10-19)

## Corpus Check
- 179 files · ~154,861 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: (none) 19, .ico 2, .css 2)

## Summary
- 1472 nodes · 2773 edges · 140 communities (72 shown, 68 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5e99116`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StoreDocumentRequest
- User
- theme-provider.tsx
- publications/page.tsx
- MessageSent
- conversations/page.tsx
- RoleAuthorizationTest
- Illuminate\Database\Eloquent\Relations\BelongsTo
- TestCase
- Illuminate\Http\JsonResponse
- Department
- departments/page.tsx
- dashboard/page.tsx
- DemoDataSeeder
- documents/page.tsx
- dashboard-sidebar.tsx
- compilerOptions
- DepartmentAuthorizationTest
- Illuminate\Database\Schema\Blueprint
- app/page.tsx
- DocumentPolicy
- RoleController
- schema-mariadb.sql
- UpdateRoleRequest
- UserFactory.php
- api.php
- UserAuthorizationTest
- trash/page.tsx
- Document
- PR Intra Front
- frontend/package.json
- bootstrap/app.php
- Illuminate\Database\Migrations\Migration
- backend/package.json
- DocumentAuthorizationTest
- DemoDataSeederTest
- CanManageAnnouncementsCentralizedTest
- MimeValidationTest
- 2026_04_06_195456_create_personal_access_tokens_table.php
- 11. Decisiones de diseño
- help-tours.ts
- AppServiceProvider.php
- composer.json
- scripts
- Coherev
- Documentacion de API para Frontend Next.js
- Do Things the Laravel Way
- Conversation
- require-dev
- config
- laravel-boost
- DemoDataSeederTest.php
- Módulos funcionales
- require
- 0001_01_01_000000_create_users_table.php
- 0001_01_01_000002_create_jobs_table.php
- psr-4
- 0001_01_01_000001_create_cache_table.php
- 2026_04_06_192437_add_department_id_to_users_table.php
- Tailwind CSS Development
- Announcement
- 2026_04_18_182105_alter_comments_table_add_fields.php
- 2026_04_20_000001_add_department_id_to_roles_table.php
- 2026_04_20_000002_fix_comments_table_structure.php
- 2026_10_06_000001_add_department_id_to_conversations_table.php
- 2026_10_06_000003_add_can_manage_department_to_roles_table.php
- 🎨 Rebranding a Coherev (BRAND-*)
- Illuminate\Support\Facades\Schema
- next
- 2026_04_06_192436_create_comments_table.php
- 2026_04_06_192436_create_conversations_table.php
- 2026_04_06_192436_create_documents_table.php
- 2026_04_06_192436_create_user_roles_table.php
- Illuminate\Foundation\Http\FormRequest
- 2026_04_06_192439_create_message_reads_table.php
- 2026_04_18_000001_create_department_folders_table.php
- MessageReadTest
- ExampleTest
- autoload-dev
- extra
- Iteraciones
- CommentRequest
- postcss.config.mjs
- DepartmentColorTest
- ROADMAP — PR-Intra · Coherev
- BACKLOG — PR-Intra (renombrar a Coherev)
- Arquitectura del proyecto
- 🛣️ Roadmap (reemplaza la carta Gantt)
- .update
- 🔴 Seguridad (SEC-*)
- StoreDepartmentRequest
- LoginRateLimitTest.php
- dependencies
- UpdateDepartmentRequest
- 2026_04_18_000002_add_folder_and_file_metadata_to_documents_table.php
- 2026_04_18_000005_add_is_visible_to_announcements_table.php
- 2026_10_19_000001_add_color_to_departments_table.php
- AnnouncementAuthorizationTest
- RoleSeederTest
- UserRoleFlagsTest
- 🟡 Documentación (DOC-*)
- 🟢 UX técnico (UX-*)
- 2026_04_06_192435_create_roles_table.php
- 2026_04_06_192437_create_conversation_user_table.php
- devDependencies
- DemoDataSeeder.php
- Documento de Arquitectura de Software
- app/layout.tsx
- Controller
- 1. Introducción
- 9. Atributos de calidad
- 4) Endpoints de Usuarios
- 5) Endpoints de Roles
- 6) Endpoints de Departamentos
- 8) Endpoints de Documentos
- StoreRoleRequest
- Illuminate\Database\Seeder
- 2. Representación arquitectónica
- scripts
- 15. Anexos
- 2) Autenticacion (Sanctum token)
- 10. Flujos críticos
- 3. Objetivos y restricciones arquitectónicas
- 5. Vista lógica
- 6. Vista de desarrollo
- 7. Vista de despliegue

## God Nodes (most connected - your core abstractions)
1. `User` - 77 edges
2. `cn()` - 38 edges
3. `Document` - 36 edges
4. `Department` - 33 edges
5. `TestCase` - 32 edges
6. `Announcement` - 30 edges
7. `Controller` - 27 edges
8. `DashboardPage()` - 25 edges
9. `Role` - 24 edges
10. `ConversationsPage()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `10.1 Flujo de autenticación` --references--> `LoginRequest`  [INFERRED]
  docs/ARCHITECTURE.md → backend/app/Http/Requests/LoginRequest.php
- `Iter 2 — Cobertura funcional 🔴` --references--> `MessageRead`  [INFERRED]
  docs/ROADMAP.md → backend/app/Models/MessageRead.php
- `Capas` --references--> `AnnouncementPolicy`  [INFERRED]
  README.md → backend/app/Policies/AnnouncementPolicy.php
- `SEC-005 · Autorización en DocumentController (escritura admin o dueño)` --references--> `DocumentPolicy`  [INFERRED]
  docs/BACKLOG.md → backend/app/Policies/DocumentPolicy.php
- `Crear mensaje` --references--> `MessageSent`  [INFERRED]
  frontend/API_NEXTJS.md → backend/app/Events/MessageSent.php

## Import Cycles
- None detected.

## Communities (140 total, 68 thin omitted)

### Community 0 - "StoreDocumentRequest"
Cohesion: 0.20
Nodes (3): RejectsMimeMismatch, StoreAnnouncementRequest, StoreDocumentRequest

### Community 2 - "theme-provider.tsx"
Cohesion: 0.23
Nodes (13): RootLayout(), emitChange(), getServerSnapshot(), getSnapshot(), listeners, readThemeFromStorage(), setExternalTheme(), subscribe() (+5 more)

### Community 3 - "publications/page.tsx"
Cohesion: 0.09
Nodes (39): Announcement, AnnouncementAttachment, AnnouncementFormState, DepartmentOption, DepartmentsResponse, formatRelativeTime(), INITIAL_FORM_STATE, makePreviewText() (+31 more)

### Community 4 - "MessageSent"
Cohesion: 0.05
Nodes (35): 11) Ejemplo rapido de cliente API en Next.js, 12) Checklist de integracion, 1) Base URL, 2) Autenticacion (Sanctum token), 3) Convencion de headers para Next.js, 4) Endpoints de Usuarios, 6) Roles por Usuario, 7) Endpoints de Documentos (+27 more)

### Community 5 - "conversations/page.tsx"
Cohesion: 0.12
Nodes (20): AppUser, BackendMessage, ChatMessage, ChatSyncEvent, Conversation, CONVERSATION_TYPE_LABEL, ConversationsPage(), conversationTitle() (+12 more)

### Community 7 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.06
Nodes (16): 10) Manejo de errores para Next.js, {closure#2}(), {closure#1}(), AnnouncementAttachment, Comment, DepartmentFolder, Message, MessageRead (+8 more)

### Community 8 - "TestCase"
Cohesion: 0.14
Nodes (4): Role, CommentTest, ExampleTest, TestCase

### Community 9 - "Illuminate\Http\JsonResponse"
Cohesion: 0.19
Nodes (4): AnnouncementController, {closure#1}(), AuthController, TrashController

### Community 10 - "Department"
Cohesion: 0.15
Nodes (4): DepartmentController, DepartmentFolderController, Department, 6.2 Estructura interna del backend

### Community 11 - "departments/page.tsx"
Cohesion: 0.12
Nodes (27): CheckboxField(), CheckboxFieldProps, ColorField(), ColorFieldProps, Department, DepartmentFormState, DepartmentsPage(), EmptyState() (+19 more)

### Community 12 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (28): Announcement, BackendMessage, ChatSkeleton(), Conversation, DashboardPage(), Department, displayRoles(), EmptyState() (+20 more)

### Community 14 - "documents/page.tsx"
Cohesion: 0.13
Nodes (22): DocumentGroup(), DocumentGroupTone, DocumentItem, DocumentsPage(), DocumentsResponse, DocumentsViewMode, formatFileSize(), getOriginLabel() (+14 more)

### Community 15 - "dashboard-sidebar.tsx"
Cohesion: 0.10
Nodes (33): BrandMark(), BrandMarkProps, SIZE_HEIGHTS, CoherevLogo(), CoherevLogoProps, CoherevLogoTone, MASK_STYLE, TONE_CLASSES (+25 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "Illuminate\Database\Schema\Blueprint"
Cohesion: 0.16
Nodes (8): {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}()

### Community 19 - "app/page.tsx"
Cohesion: 0.12
Nodes (14): BackdropDecor(), BrandPanel(), Field(), FieldErrors, FieldProps, HIGHLIGHTS, Home(), LaravelValidationErrorPayload (+6 more)

### Community 21 - "RoleController"
Cohesion: 0.11
Nodes (6): CommentController, RoleController, UserController, CommentResource, RoleResource, UserResource

### Community 22 - "schema-mariadb.sql"
Cohesion: 0.17
Nodes (22): announcement_attachments, announcements, cache, cache_locks, comments, conversation_user, conversations, department_folders (+14 more)

### Community 27 - "trash/page.tsx"
Cohesion: 0.21
Nodes (14): EmptyTrash(), Filter, FilterChip(), formatBytes(), formatDateTime(), MeResponse, TrashDocument, TrashItem() (+6 more)

### Community 28 - "Document"
Cohesion: 0.16
Nodes (4): {closure#5}(), DocumentController, {closure#2}(), Document

### Community 29 - "PR Intra Front"
Cohesion: 0.13
Nodes (15): Autenticacion y Sesion, Ejecucion Local, Estructura Funcional, Instalacion, Integracion con Backend, Notas de Desarrollo, PR Intra Front, Referencias (+7 more)

### Community 30 - "frontend/package.json"
Cohesion: 0.12
Nodes (15): eslintConfig, laravel-echo, pusher-js, tailwindcss, name, private, version, eslint (+7 more)

### Community 31 - "bootstrap/app.php"
Cohesion: 0.21
Nodes (4): AdminOnly, {closure#1}(), {closure#2}(), {closure#3}()

### Community 33 - "backend/package.json"
Cohesion: 0.06
Nodes (27): devDependencies, axios, concurrently, laravel-echo, laravel-vite-plugin, pusher-js, tailwindcss, @tailwindcss/vite (+19 more)

### Community 39 - "11. Decisiones de diseño"
Cohesion: 0.25
Nodes (8): 11. Decisiones de diseño, DD-1 — Sanctum PAT sobre Sanctum SPA, DD-2 — Reverb como servidor WebSocket principal, DD-3 — MariaDB sobre MySQL puro, DD-4 — BroadcastChannel del navegador, DD-5 — Almacenamiento de token por sesión, DD-6 — Validación con Form Requests, DD-7 — Tailwind CSS v4 con tokens semánticos

### Community 40 - "help-tours.ts"
Cohesion: 0.15
Nodes (11): buildSteps(), CONVERSATIONS_TOUR, DASHBOARD_TOUR, DOCUMENTS_TOUR, HelpTourId, PUBLICATIONS_TOUR, startHelpTour(), TOUR_LABELS (+3 more)

### Community 42 - "composer.json"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 43 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 44 - "Coherev"
Cohesion: 0.10
Nodes (21): Arquitectura General, Auto-rebuild en commits, Backend — Laravel 13, Capas, Capas, Coherev, Comunicación en tiempo real, Configuración de `.gitignore` (+13 more)

### Community 45 - "Documentacion de API para Frontend Next.js"
Cohesion: 0.18
Nodes (11): 12) Ejemplo rapido de cliente API en Next.js, 13) Checklist de integracion, 1) Base URL, 3) Convencion de headers para Next.js, 7) Roles por Usuario, 9) Endpoints de Conversaciones, Crear conversacion, Documentacion de API para Frontend Next.js (+3 more)

### Community 46 - "Do Things the Laravel Way"
Cohesion: 0.05
Nodes (36): APIs & Eloquent Resources, Application Structure & Architecture, Artisan Commands, Authentication & Authorization, Available Search Syntax, Comments, Configuration, Constructors (+28 more)

### Community 47 - "Conversation"
Cohesion: 0.21
Nodes (3): {closure#1}(), ConversationController, Conversation

### Community 48 - "require-dev"
Cohesion: 0.25
Nodes (8): require-dev, fakerphp/faker, laravel/boost, laravel/pail, laravel/pint, mockery/mockery, nunomaduro/collision, phpunit/phpunit

### Community 49 - "config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 50 - "laravel-boost"
Cohesion: 0.29
Nodes (6): command, enabled, type, mcp, laravel-boost, $schema

### Community 53 - "require"
Cohesion: 0.33
Nodes (6): require, laravel/framework, laravel/reverb, laravel/sanctum, laravel/tinker, php

### Community 54 - "0001_01_01_000000_create_users_table.php"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 55 - "0001_01_01_000002_create_jobs_table.php"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 56 - "psr-4"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 61 - "Tailwind CSS Development"
Cohesion: 0.14
Nodes (13): Basic Usage, Common Patterns, Common Pitfalls, CSS-First Configuration, Dark Mode, Documentation, Flexbox Layout, Grid Layout (+5 more)

### Community 68 - "🎨 Rebranding a Coherev (BRAND-*)"
Cohesion: 0.18
Nodes (11): BRAND-001 · Wordmark + isotipo + tagline Coherev, BRAND-002 · Refinar tokens CSS (mantener paleta actual), BRAND-003 · Rebranding del login, BRAND-004 · Rebranding del sidebar, BRAND-005 · Rebranding del dashboard (Inicio), BRAND-006 · Rebranding de páginas internas, BRAND-007 · Voice & tone Coherev + microcopy, BRAND-008 · Onboarding tour con marca Coherev (+3 more)

### Community 70 - "next"
Cohesion: 0.18
Nodes (4): ErrorPageProps, backendOrigin, nextConfig, next

### Community 75 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.13
Nodes (5): LoginRequest, StoreCommentRequest, SyncUserRolesRequest, UpdateAnnouncementRequest, UpdateDocumentRequest

### Community 82 - "autoload-dev"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 83 - "extra"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

### Community 84 - "Iteraciones"
Cohesion: 0.18
Nodes (11): 5.1 Identidad, 5.2 Pantallas, 5.3 Polish técnico, Iter 0 — Fundamentos ✅, Iter 1 — Seguridad y Roles 🔴 (ACTIVA), Iter 2 — Cobertura funcional 🔴, Iter 3 — Documentación 🟡 *(paralela a Iter 2)*, Iter 4 — Validación con usuarios 🟡 (+3 more)

### Community 97 - "ROADMAP — PR-Intra · Coherev"
Cohesion: 0.22
Nodes (7): Cadencia, Checkpoint con Cindy (próxima presentación), Definition of Done (universal), Dependencias entre iteraciones, Equipo, ROADMAP — PR-Intra · Coherev, Vista ágil (Now / Next / Later)

### Community 98 - "BACKLOG — PR-Intra (renombrar a Coherev)"
Cohesion: 0.22
Nodes (9): BACKLOG — PR-Intra (renombrar a Coherev), Convenciones, Estado actual del backlog, 📌 Notas, ROL-001 · Modelar los 4 roles (Administrador, Líder, Colaborador, Nuevo Ingreso), ROL-002 · Refactor `User::canManageAnnouncements()`, ROL-003 · Sidebar y rutas según los 4 roles, 🔴 Roles (ROL-*) (+1 more)

### Community 99 - "Arquitectura del proyecto"
Cohesion: 0.20
Nodes (9): Arquitectura del proyecto, Capas principales, Ejecutar en Windows, Estructura base, Flujo general, Instalación, Módulos funcionales, PR Intra Back (+1 more)

### Community 100 - "🛣️ Roadmap (reemplaza la carta Gantt)"
Cohesion: 0.25
Nodes (8): Iteración 0 — Fundamentos ✅, Iteración 1 — Seguridad 🔴 (prioridad inmediata), Iteración 2 — Cobertura funcional 🔴, Iteración 3 — Documentación 🟡, Iteración 4 — Validación con usuarios 🟡, Iteración 5 — UX Rebranding (Coherev) 🟡, Iteración 6 — Cierre 🟡, 🛣️ Roadmap (reemplaza la carta Gantt)

### Community 102 - "🔴 Seguridad (SEC-*)"
Cohesion: 0.29
Nodes (7): SEC-001 · Rate-limit en login, SEC-002 · Autorización en UserController (solo admin), SEC-003 · Autorización en DepartmentController (solo admin), SEC-004 · Autorización en RoleController (solo admin), SEC-005 · Autorización en DocumentController (escritura admin o dueño), SEC-006 · Validar MIME real en uploads, 🔴 Seguridad (SEC-*)

### Community 105 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, driver.js, framer-motion, laravel-echo, lucide-react, next, pusher-js, react (+1 more)

### Community 113 - "🟡 Documentación (DOC-*)"
Cohesion: 0.40
Nodes (5): DOC-001 · Diagrama de arquitectura, DOC-003 · Documento de RF y RNF, DOC-004 · Historias de usuario, DOC-005 · Matriz de trazabilidad, 🟡 Documentación (DOC-*)

### Community 114 - "🟢 UX técnico (UX-*)"
Cohesion: 0.40
Nodes (5): UX-001 · Sidebar móvil (drawer) con marca, UX-002 · Accesibilidad WCAG AA, UX-003 · Errores por campo (no solo mensaje global), UX-004 · Vista móvil del chat mejorada, 🟢 UX técnico (UX-*)

### Community 117 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 119 - "Documento de Arquitectura de Software"
Cohesion: 0.29
Nodes (6): 12. Riesgos y mitigaciones, 13. Conclusiones, 14. Referencias bibliográficas, 4. Vista de casos de uso, Documento de Arquitectura de Software, Índice

### Community 120 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, viewport, driver.js

### Community 122 - "1. Introducción"
Cohesion: 0.33
Nodes (6): 1.1 Propósito del documento, 1.2 Alcance, 1.3 Definiciones, acrónimos y abreviaciones, 1.4 Referencias, 1.5 Visión general del documento, 1. Introducción

### Community 123 - "9. Atributos de calidad"
Cohesion: 0.33
Nodes (6): 9.1 Seguridad, 9.2 Rendimiento, 9.3 Disponibilidad, 9.4 Mantenibilidad, 9.5 Usabilidad, 9. Atributos de calidad

### Community 124 - "4) Endpoints de Usuarios"
Cohesion: 0.33
Nodes (6): 4) Endpoints de Usuarios, Actualizar usuario, Crear usuario, Eliminar usuario, Listar usuarios, Ver usuario

### Community 125 - "5) Endpoints de Roles"
Cohesion: 0.33
Nodes (6): 5) Endpoints de Roles, Actualizar rol, Crear rol, Eliminar rol, Listar roles por departamento, Listar todos los roles

### Community 126 - "6) Endpoints de Departamentos"
Cohesion: 0.33
Nodes (6): 6) Endpoints de Departamentos, Actualizar departamento, Crear departamento, Eliminar departamento, Listar departamentos, Ver departamento

### Community 127 - "8) Endpoints de Documentos"
Cohesion: 0.33
Nodes (6): 8) Endpoints de Documentos, Actualizar documento, Crear documento, Eliminar documento, Listar documentos, Ver documento

### Community 130 - "2. Representación arquitectónica"
Cohesion: 0.40
Nodes (5): 2.1 Cliente web — Next.js 16, 2.2 Servidor backend — Laravel 13, 2.3 Capa de autenticación — Laravel Sanctum v4, 2.4 Capa de tiempo real — Laravel Reverb, 2. Representación arquitectónica

### Community 131 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 133 - "15. Anexos"
Cohesion: 0.50
Nodes (4): 15. Anexos, Anexo A — Glosario de endpoints principales, Anexo B — Estructura del repositorio, Anexo C — Configuración del entorno

### Community 134 - "2) Autenticacion (Sanctum token)"
Cohesion: 0.50
Nodes (4): 2) Autenticacion (Sanctum token), Login, Logout, Obtener usuario autenticado

### Community 135 - "10. Flujos críticos"
Cohesion: 0.67
Nodes (3): 10.1 Flujo de autenticación, 10.2 Flujo de tiempo real (chat), 10. Flujos críticos

### Community 136 - "3. Objetivos y restricciones arquitectónicas"
Cohesion: 0.67
Nodes (3): 3.1 Objetivos arquitectónicos, 3.2 Restricciones arquitectónicas, 3. Objetivos y restricciones arquitectónicas

### Community 137 - "5. Vista lógica"
Cohesion: 0.67
Nodes (3): 5.1 Backend en capas, 5.2 Frontend en capas, 5. Vista lógica

### Community 138 - "6. Vista de desarrollo"
Cohesion: 0.67
Nodes (3): 6.1 Estructura del repositorio, 6.4 Estrategia de branching, 6. Vista de desarrollo

### Community 139 - "7. Vista de despliegue"
Cohesion: 0.67
Nodes (3): 7.1 Entorno de desarrollo local, 7.2 Entorno de producción (fuera del alcance académico), 7. Vista de despliegue

## Knowledge Gaps
- **13 isolated node(s):** `concurrently`, `laravel-echo`, `pusher-js`, `tailwindcss`, `laravel-echo` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 657 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **68 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Illuminate\Database\Seeder`, `RoleAuthorizationTest`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `TestCase`, `Illuminate\Http\JsonResponse`, `Department`, `DemoDataSeeder`, `DepartmentAuthorizationTest`, `DocumentPolicy`, `RoleController`, `UserFactory.php`, `UserAuthorizationTest`, `DocumentAuthorizationTest`, `CanManageAnnouncementsCentralizedTest`, `MimeValidationTest`, `Conversation`, `DemoDataSeederTest.php`, `Announcement`, `MessageReadTest`, `DepartmentColorTest`, `.update`, `LoginRateLimitTest.php`, `DemoDataSeeder.php`, `Controller`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `concurrently`, `laravel-echo`, `pusher-js` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `publications/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08985200845665962 - nodes in this community are weakly interconnected._
- **Why does `Department` connect `Department` to `DocumentAuthorizationTest`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `TestCase`, `Illuminate\Http\JsonResponse`, `LoginRateLimitTest.php`, `DemoDataSeederTest.php`, `RoleController`, `DemoDataSeeder.php`, `Document`, `Announcement`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `MessageSent` be split into smaller, more focused modules?**
  _Cohesion score 0.049682875264270614 - nodes in this community are weakly interconnected._
- **Why does `MessageRead` connect `Illuminate\Database\Eloquent\Relations\BelongsTo` to `DemoDataSeederTest.php`, `Iteraciones`, `Módulos funcionales`, `Conversation`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `conversations/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._