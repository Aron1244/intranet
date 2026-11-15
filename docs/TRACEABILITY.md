# Matriz de trazabilidad — Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Entregable | Matriz de trazabilidad — Observación 2 y 6 |
| Versión | 1.0 (15 de noviembre de 2026) |
| Fuentes | `Fase 2.1/8 y 9-requerimientos F y NF.docx`, `Fase 2.1/10-historias de usuario.docx`, `Fase 2.2/2-Casos de prueba.pdf`, `Fase 2.2/6-Checklist de termino del proyecto.md` |
| Integrantes | Benjamín Herrera (Backend) / Julián Tapia (Frontend) |
| Docente guía | Cindy Betzabé Contador Cisterna |

## 1. Cómo leer la matriz

Cada fila recorre la cadena completa de un requerimiento: el **problema** que resuelve, el **ID** del requerimiento, la **historia de usuario** que lo asume, la **funcionalidad** donde vive en el código y el **caso de prueba** que lo verifica. Los identificadores son estables entre documentos: un `RF-CHT-06` designa lo mismo en el documento de requerimientos, en las historias de usuario, en el código y en los casos de prueba.

## 2. Problemas por módulo

| Módulo | Problema que resuelve | Requerimientos |
| --- | --- | --- |
| Autenticación y sesión | El acceso a la intranet no tenía control de sesión ni trazabilidad de la identidad: no se sabía quién había entrado ni desde qué dispositivo. | RF-AUT-01, RF-AUT-02, RF-AUT-03, RF-AUT-04 … (8 en total) |
| Usuarios | El directorio de usuarios se llevaba a mano: altas, bajas y cambios de rol no tenían herramienta y podían quedar desincronizados con los accesos. | RF-USR-01, RF-USR-02, RF-USR-03, RF-USR-04 … (5 en total) |
| Roles y permisos | Los permisos vivían dispersos en cada vista, sin un modelo de roles que definiera de forma explícita qué puede hacer cada perfil. | RF-ROL-01, RF-ROL-02, RF-ROL-03, RF-ROL-04 … (5 en total) |
| Departamentos y carpetas | No había una estructura organizacional reconocible, de modo que los documentos no tenían responsable ni ubicación estable. | RF-DEP-01, RF-DEP-02, RF-DEP-03, RF-DEP-04 |
| Chat en tiempo real | La comunicación interna ocurría fuera de la organización —correo y mensajería externa—, donde se pierde el contexto y no hay control de acceso. | RF-CHT-01, RF-CHT-02, RF-CHT-03, RF-CHT-04 … (11 en total) |
| Publicaciones y comentarios | Los comunicados internos no llegaban de forma dirigida a los destinarios correctos y no existía un canal para discutirlos. | RF-PUB-01, RF-PUB-02, RF-PUB-03, RF-PUB-04 … (7 en total) |
| Documentos | La documentación viva estaba en carpetas compartidas, sin control de acceso por rol ni trazabilidad de su responsable. | RF-DOC-01, RF-DOC-02, RF-DOC-03, RF-DOC-04 … (5 en total) |
| Módulos previstos | Quedaron huecos de experiencia: sin gestión de tareas, sin directorio de personas y sin panel de bienvenida para quien se incorpora. | RF-FUT-01, RF-FUT-02, RF-FUT-03, RF-FUT-04 … (6 en total) |
| Atributos de calidad | Sin atributos de calidad explícitos la base no era mantenible, medible ni auditable por el equipo que tenía que sostenerla. | RNF-DISP (6), RNF-MANT (7), RNF-REN (6), RNF-SEG (9), RNF-UXA (7) |

## 3. Matriz completa

| ID | Requerimiento | HU | Funcionalidad | Prueba | Estado |
| --- | --- | --- | --- | --- | --- |
| `RF-AUT-01` | Autenticar al usuario mediante correo corporativo y contraseña en POST /login | HU-001 | AuthController::login | — | [x] |
| `RF-AUT-02` | Permitir «mantener la sesión iniciada»: token en localStorage o sessionStorage según la… | HU-001 | lib/auth-token.ts | CP-005 | [x] |
| `RF-AUT-03` | Limitar el login a 5 intentos por minuto por IP y correo, respondiendo 429 al superar el… | — | Limit::perMinute(5)->by(ip\|email) | CP-004 | [x] |
| `RF-AUT-04` | Responder con mensaje genérico ante credenciales inválidas sin revelar si el correo existe | HU-001 | Frontend + backend | CP-002, CP-003 | [x] |
| `RF-AUT-05` | Validar la sesión en GET /me devolviendo el usuario con sus roles y permisos | HU-001 | AuthController::me | CP-007 | [x] |
| `RF-AUT-06` | Revocar el token del dispositivo al cerrar sesión (POST /logout) y limpiar el… | — | AuthController::logout | CP-008 | [x] |
| `RF-AUT-07` | Enviar el token en cada petición protegida mediante Authorization: Bearer (Sanctum PAT) | — | lib/api-client.ts | — | [x] |
| `RF-AUT-08` | Responder 401 ante token inválido o expirado; el frontend limpia la sesión y redirige al… | — | api-client.ts | CP-010 | [x] |
| `RF-CHT-01` | Listar las conversaciones en las que participa el usuario autenticado | HU-007 | ConversationController::index | CP-015 | [x] |
| `RF-CHT-02` | Crear conversaciones privadas (1 usuario) o grupales (2 o más), calculando el tipo… | — | ConversationController::store | CP-016 | [x] |
| `RF-CHT-03` | Entregar el historial solo a participantes de la conversación (403 en caso contrario) | HU-007 | MessageController::index | CP-017 | [x] |
| `RF-CHT-04` | Permitir el envío de mensajes de texto | — | MessageController::store | CP-018 | [x] |
| `RF-CHT-05` | Permitir adjuntos de hasta 20 MB en los mensajes | — | StoreMessageRequest | CP-020 | [x] |
| `RF-CHT-06` | Entregar mensajes en tiempo real vía WebSocket (Reverb, con Pusher como fallback) en canal… | HU-007 | MessageSent` + `routes/channels.php | CP-018 | [~] |
| `RF-CHT-07` | Autorizar la suscripción al canal solo a los participantes de la conversación | — | Broadcast::channel | — | [~] |
| `RF-CHT-08` | Registrar la lectura de mensajes en la tabla `message_reads` al abrir una conversación | HU-010 | ConversationController::markAsRead | CP-019 | [x] |
| `RF-CHT-09` | Calcular el contador de no leídos desde la base de datos, no desde el cliente | HU-010 | ConversationController::index | CP-019 | [x] |
| `RF-CHT-10` | Sincronizar el estado del chat entre pestañas del mismo usuario (BroadcastChannel) | HU-010 | lib/session-context.tsx | CP-019, CP-033 | [x] |
| `RF-CHT-11` | Permitir solo al Administrador eliminar mensajes y conversaciones | — | Middleware admin | — | [x] |
| `RF-DEP-01` | Solo el Administrador puede crear, editar y eliminar departamentos; los Líderes solo pueden… | HU-003, HU-004 | DepartmentController | CP-012 | [x] |
| `RF-DEP-02` | Al eliminar un departamento, eliminar en cascada sus roles asociados | HU-003 | DepartmentController::destroy | CP-012 | [x] |
| `RF-DEP-03` | Listar y crear carpetas documentales por departamento | — | DepartmentFolderController | — | [x] |
| `RF-DEP-04` | Permitir subir documentos a una carpeta de departamento | — | DocumentController::storeDepartmentDocument | — | [x] |
| `RF-DOC-01` | Listar y mostrar documentos según su visibilidad (public, department, private) | HU-008 | DocumentController` + `DocumentPolicy | CP-025 | [x] |
| `RF-DOC-02` | Subir, editar y eliminar documentos solo por su dueño o un Administrador | — | DocumentPolicy::canMutate | CP-026 | [x] |
| `RF-DOC-03` | Permitir la descarga de documentos autorizados | HU-008 | DocumentController::download | CP-025 | [x] |
| `RF-DOC-04` | Validar el MIME real de los archivos, rechazando con 415 los que no coincidan | — | RejectsMimeMismatch | CP-014 | [x] |
| `RF-DOC-05` | Almacenar archivos en carpetas funcionales del disco público (announcements… | — | config/filesystems.php | — | [x] |
| `RF-FUT-01` | Módulo Tareas: tablero Kanban interno por equipo, visible para Líderes y Administradores | HU-006 | app/dashboard/tasks/page.tsx | — | [ ] |
| `RF-FUT-02` | Módulo Directorio: vista pública de colaboradores | HU-013 | — | — | [ ] |
| `RF-FUT-03` | Panel de Novedades: contenido destacado para el rol Nuevo Ingreso | HU-012 | — | — | [ ] |
| `RF-FUT-04` | Búsqueda global por usuarios, documentos y mensajes | — | Búsqueda por módulo | — | [ ] |
| `RF-FUT-05` | Notificaciones push para anuncios y mensajes | — | — | — | [ ] |
| `RF-FUT-06` | Auditoría y logs de actividad por usuario | — | — | — | [ ] |
| `RF-PUB-01` | Mostrar publicaciones según su visibilidad y el departamento o rol del usuario | HU-005, HU-009 | AnnouncementController` + `AnnouncementPolicy | CP-021 | [x] |
| `RF-PUB-02` | Permitir crear publicaciones solo a usuarios con permiso `can_post_announcements` | HU-005 | User::canManageAnnouncements() | CP-021 | [x] |
| `RF-PUB-03` | Editar y eliminar publicaciones según la `AnnouncementPolicy` (creador o Administrador) | — | AnnouncementPolicy | CP-024 | [x] |
| `RF-PUB-04` | Permitir adjuntar archivos a una publicación y descargarlos | HU-005 | AnnouncementController::downloadAttachment | CP-022 | [x] |
| `RF-PUB-05` | Validar el MIME real de los adjuntos antes de almacenarlos | HU-005 | RejectsMimeMismatch | CP-014 | [x] |
| `RF-PUB-06` | Permitir comentar publicaciones visibles del propio departamento | HU-009 | CommentController::store | CP-023 | [x] |
| `RF-PUB-07` | Eliminar un comentario por su autor o, según política, por el Administrador o creador de la… | HU-009 | CommentController::destroy | CP-023 | [x] |
| `RF-ROL-01` | Modelar los 4 roles del negocio: Administrador, Líder, Colaborador y Nuevo Ingreso… | — | app/Models/Role.php | — | [x] |
| `RF-ROL-02` | Permitir solo al Administrador crear, editar y eliminar roles; lectura abierta para… | HU-003 | RoleController | CP-013 | [x] |
| `RF-ROL-03` | Asociar cada rol a un departamento y exponer el permiso booleano `can_post_announcements` | HU-003 | roles.department_id | CP-013 | [x] |
| `RF-ROL-04` | Centralizar el permiso de publicación (`canManageAnnouncements`) por rol y cubrirlo con… | — | User::canManageAnnouncements() | — | [x] |
| `RF-ROL-05` | Adaptar sidebar y rutas según el rol: Novedades (Nuevo Ingreso), Tareas (Líder), chat y… | HU-006, HU-012 | NAV_ITEMS | CP-029 | [x] |
| `RF-USR-01` | Solo un Administrador puede listar, ver, crear, editar y eliminar usuarios | HU-002 | `UserController` + middleware admin | CP-011 | [x] |
| `RF-USR-02` | Crear usuarios con nombre, correo corporativo único y contraseña de mínimo 8 caracteres… | HU-002 | StoreUserRequest | CP-028 | [x] |
| `RF-USR-03` | Permitir la asignación de roles a un usuario (PUT /users/{user}/roles) | HU-002 | UserRoleController | CP-028 | [x] |
| `RF-USR-04` | Asociar cada usuario a un departamento | — | Migración `department_user` | CP-028 | [x] |
| `RF-USR-05` | Rechazar con 403 cualquier operación de gestión de usuarios por un usuario sin rol… | HU-002 | Middleware admin | CP-011 | [x] |
| `RNF-DISP-01` | Funcionamiento en entorno local y despliegue sin dependencias de terceros pagados | — | Entorno local verificado; costo total de licencias $0 CLP según 2-acta de constitucion | — | [x] |
| `RNF-DISP-02` | Capa de tiempo real con Reverb como servidor principal y Pusher como fallback configurable | — | `config/reverb.php`, `lib/echo-client.ts`, variables `NEXT_PUBLIC_PUSHER_*`. Transporte verificado el 15 nov 2026 (handshake 101); la autorización del canal privado está bloqueada por DEF-033 | — | [x] |
| `RNF-DISP-03` | Base de datos MariaDB (compatible MySQL) accedida exclusivamente mediante Eloquent | — | `DB_CONNECTION=mariadb`; los 11 modelos usan Eloquent. La única excepción es un `selectRaw` en `ConversationController` para agregar el contador de no leídos | — | [x] |
| `RNF-DISP-04` | Compatibilidad con navegadores modernos (Chrome, Edge y Firefox en sus últimas 2 versiones) | — | Pendiente de verificación formal en la campaña. Caso CP-033 | — | [ ] |
| `RNF-DISP-05` | Persistencia del token según preferencia (localStorage o sessionStorage) | — | `lib/auth-token.ts`; casos CP-005 y CP-006 | CP-005 | [x] |
| `RNF-DISP-06` | Invalidación de la sesión en todas las pestañas al recibir un 401 en cualquiera | — | `lib/session-context.tsx`; caso CP-010 | CP-010 | [x] |
| `RNF-MANT-01` | Backend en patrón MVC por capas: controladores delgados, Form Requests y API Resources | — | Estructura de `backend/app/`; corregido en DEF-030 | — | [x] |
| `RNF-MANT-02` | Reglas de negocio en modelos y Policies, no en controladores | — | app/Policies/`, `app/Models/User.php | — | [x] |
| `RNF-MANT-03` | Cobertura de la funcionalidad crítica con tests PHPUnit; sin romper la suite existente | — | 133 pruebas / 468 aserciones en verde, 256,47 s (15 nov 2026), 20 archivos de prueba (19 Feature + 1 Unit) | CP-027 | [x] |
| `RNF-MANT-04` | Código consistente con Laravel Pint y las convenciones del monorepo | — | Commit 6726b45 (formato con Pint) | — | [x] |
| `RNF-MANT-05` | Documentación mantenida del proyecto (API, arquitectura, esquema ER, trazabilidad) | — | Parcial. Faltan seis archivos prometidos por el documento de arquitectura: `DATABASE.md`, `REQUIREMENTS.md`, `USER_STORIES.md`, `TRACEABILITY.md`, `VOICE_TONE.md` y `evidence/` (§3.1). Desde la v1.1, este checklist tiene además fuente Markdown regenerable | — | [~] |
| `RNF-MANT-06` | Integraciones externas concentradas en la carpeta `lib/` del frontend | — | lib/api-client.ts`, `lib/auth-token.ts`, `lib/echo-client.ts`, `lib/attachment-url.ts | — | [x] |
| `RNF-MANT-07` | Versionado público de la API planificado a futuro (/api/v1, /api/v2) | — | Fuera del alcance priorizado (roadmap) | — | [ ] |
| `RNF-REN-01` | Paginación de historiales de mensajes y listados grandes | — | Paginación en Documentos (12/pág.), Usuarios (15/pág.) y feed por tandas | — | [x] |
| `RNF-REN-02` | Eager loading en las consultas para evitar el problema N+1 | — | AnnouncementController` eager-loads attachments; `UserDepartmentsTest | — | [x] |
| `RNF-REN-03` | Tiempo de respuesta menor a 500 ms en el 95 % de las peticiones de lectura | — | Pendiente de medición formal. Caso CP-032 | CP-032 | [ ] |
| `RNF-REN-04` | Notificación de un mensaje en tiempo real en menos de 500 ms desde su envío | — | Pendiente de medición formal y bloqueado: la entrega en vivo no se produce (DEF-032 y DEF-033), de modo que no hay latencia que medir. Caso CP-018 | CP-018, CP-032 | [ ] |
| `RNF-REN-05` | Dashboard con contenido inicial (LCP) por debajo de 2,5 s en hardware representativo | — | Pendiente de medición formal. Caso CP-032 | CP-030, CP-032 | [ ] |
| `RNF-REN-06` | Reutilización de componentes y tokens para evitar duplicación de estilos y lógica | — | components/`, `lib/`, tokens CSS en `app/globals.css | — | [x] |
| `RNF-SEG-01` | Toda comunicación debe usar HTTPS en producción; el token viaja en Authorization: Bearer | — | Parcial. El token viaja correctamente en el encabezado — verificado el 15 nov 2026: `GET /api/me` con `Authorization: Bearer` responde 200. HTTPS solo aplica en producción, que está fuera del alcance del proyecto. Verificar en la instalación final | — | [x] |
| `RNF-SEG-02` | Contraseñas con hash bcrypt y tokens Sanctum almacenados solo como hash | — | config/auth.php`, bcrypt con `BCRYPT_ROUNDS=12 | — | [x] |
| `RNF-SEG-03` | La contraseña del usuario no debe aparecer en ninguna respuesta de la API | — | `User` no expone password; CP-007 lo verifica | CP-007 | [x] |
| `RNF-SEG-04` | Toda ruta exige autenticación (`auth:sanctum`) salvo el login; operaciones sensibles con… | — | `routes/api.php`; CP-009, CP-011 | CP-009 | [x] |
| `RNF-SEG-05` | Validar toda entrada con Form Requests (tipo, formato, tamaño, unicidad) antes de tocar el… | — | `app/Http/Requests/`; migrado en DEF-030 | — | [x] |
| `RNF-SEG-06` | Validar el MIME real en todos los endpoints de subida de archivos | — | RejectsMimeMismatch`; `MimeValidationTest | CP-014 | [x] |
| `RNF-SEG-07` | Rate-limiting del login: 5 intentos por minuto por IP y correo | — | `AppServiceProvider`; `LoginRateLimitTest`; verificado el 15 nov 2026 (la API responde 429 al superar el límite) | CP-004 | [x] |
| `RNF-SEG-08` | Tokens revocables por dispositivo (logout o gestión administrativa) | — | `AuthController::logout`; CP-008 | CP-008 | [x] |
| `RNF-SEG-09` | Errores de credenciales genéricos que no revelen la existencia del correo | — | CP-002, CP-003; verificado el 15 nov 2026 (login inválido responde 422 «Credenciales inválidas.» sin distinguir el caso de correo inexistente) | CP-003 | [x] |
| `RNF-UXA-01` | Cumplir WCAG nivel AA (contraste, foco visible, aria-label en controles solo-icono) | — | Parcial. Foco visible, aria-label y contraste verificado en el commit 04d7a70; falta la auditoría con axe-core (no declarado como dependencia). Caso CP-033 | CP-033 | [~] |
| `RNF-UXA-02` | Errores de formulario por campo, con foco al primer campo inválido | — | Parcial. Falta el mapa de errores del servidor a cada input (tarjeta UX-003). Caso CP-034 | CP-034 | [~] |
| `RNF-UXA-03` | Interfaz responsive, con sidebar tipo drawer en móvil y chat usable en pantallas pequeñas | — | Parcial. El drawer existe (`lib/mobile-nav-store.ts`, `lib/use-mobile-nav.ts`) y funciona con Esc y clic fuera; falta cerrar la tarjeta UX-001/UX-004. Caso CP-033 | CP-033 | [~] |
| `RNF-UXA-04` | Onboarding guiado para nuevos usuarios (driver.js) en un tour de hasta 5 pasos | HU-011 | `lib/help-tours.ts` con 5 recorridos; CP-031 | CP-031 | [x] |
| `RNF-UXA-05` | Estados vacíos ilustrados y consistentes, con llamado a la acción contextual | — | Parcial. La vista de Papelera ya tiene su estado vacío; falta el componente EmptyState reutilizable en el resto de páginas (tarjeta BRAND-010) | CP-022, CP-030 | [~] |
| `RNF-UXA-06` | Mensajes de error 4xx/5xx claros y con microcopy de marca Coherev | — | Parcial. Los mensajes de login y el 429 están escritos; falta el reescriturado completo de errores (tarjeta BRAND-007). Caso CP-034 | CP-034 | [~] |
| `RNF-UXA-07` | Julián Tapia | — | — | — | Pendiente |

## 4. Cobertura

| Indicador | Valor |
| --- | --- |
| Requerimientos totales | 86 |
| Con historia de usuario | 31 |
| Con caso de prueba | 54 |
| Con implementación verificada | 74 |

### Requerimientos sin historia de usuario

Estos requerimientos se verifican directamente contra la API o la interfaz, sin una historia de usuario que los narre:

- `RF-AUT-03` — Limitar el login a 5 intentos por minuto por IP y correo, respondiendo 429 al superar el límite
- `RF-AUT-06` — Revocar el token del dispositivo al cerrar sesión (POST /logout) y limpiar el almacenamiento del cliente
- `RF-AUT-07` — Enviar el token en cada petición protegida mediante Authorization: Bearer (Sanctum PAT)
- `RF-AUT-08` — Responder 401 ante token inválido o expirado; el frontend limpia la sesión y redirige al login
- `RF-CHT-02` — Crear conversaciones privadas (1 usuario) o grupales (2 o más), calculando el tipo automáticamente
- `RF-CHT-04` — Permitir el envío de mensajes de texto
- `RF-CHT-05` — Permitir adjuntos de hasta 20 MB en los mensajes
- `RF-CHT-07` — Autorizar la suscripción al canal solo a los participantes de la conversación
- `RF-CHT-11` — Permitir solo al Administrador eliminar mensajes y conversaciones
- `RF-DEP-03` — Listar y crear carpetas documentales por departamento
- `RF-DEP-04` — Permitir subir documentos a una carpeta de departamento
- `RF-DOC-02` — Subir, editar y eliminar documentos solo por su dueño o un Administrador
- `RF-DOC-04` — Validar el MIME real de los archivos, rechazando con 415 los que no coincidan
- `RF-DOC-05` — Almacenar archivos en carpetas funcionales del disco público (announcements, documents/department, documents/chat)
- `RF-FUT-04` — Búsqueda global por usuarios, documentos y mensajes
- `RF-FUT-05` — Notificaciones push para anuncios y mensajes
- `RF-FUT-06` — Auditoría y logs de actividad por usuario
- `RF-PUB-03` — Editar y eliminar publicaciones según la `AnnouncementPolicy` (creador o Administrador)
- `RF-ROL-01` — Modelar los 4 roles del negocio: Administrador, Líder, Colaborador y Nuevo Ingreso, precargados por seeder
- `RF-ROL-04` — Centralizar el permiso de publicación (`canManageAnnouncements`) por rol y cubrirlo con tests
- `RF-USR-04` — Asociar cada usuario a un departamento
- `RNF-DISP-01` — Funcionamiento en entorno local y despliegue sin dependencias de terceros pagados
- `RNF-DISP-02` — Capa de tiempo real con Reverb como servidor principal y Pusher como fallback configurable
- `RNF-DISP-03` — Base de datos MariaDB (compatible MySQL) accedida exclusivamente mediante Eloquent
- `RNF-DISP-04` — Compatibilidad con navegadores modernos (Chrome, Edge y Firefox en sus últimas 2 versiones)
- `RNF-DISP-05` — Persistencia del token según preferencia (localStorage o sessionStorage)
- `RNF-DISP-06` — Invalidación de la sesión en todas las pestañas al recibir un 401 en cualquiera
- `RNF-MANT-01` — Backend en patrón MVC por capas: controladores delgados, Form Requests y API Resources
- `RNF-MANT-02` — Reglas de negocio en modelos y Policies, no en controladores
- `RNF-MANT-03` — Cobertura de la funcionalidad crítica con tests PHPUnit; sin romper la suite existente
- `RNF-MANT-04` — Código consistente con Laravel Pint y las convenciones del monorepo
- `RNF-MANT-05` — Documentación mantenida del proyecto (API, arquitectura, esquema ER, trazabilidad)
- `RNF-MANT-06` — Integraciones externas concentradas en la carpeta `lib/` del frontend
- `RNF-MANT-07` — Versionado público de la API planificado a futuro (/api/v1, /api/v2)
- `RNF-REN-01` — Paginación de historiales de mensajes y listados grandes
- `RNF-REN-02` — Eager loading en las consultas para evitar el problema N+1
- `RNF-REN-03` — Tiempo de respuesta menor a 500 ms en el 95 % de las peticiones de lectura
- `RNF-REN-04` — Notificación de un mensaje en tiempo real en menos de 500 ms desde su envío
- `RNF-REN-05` — Dashboard con contenido inicial (LCP) por debajo de 2,5 s en hardware representativo
- `RNF-REN-06` — Reutilización de componentes y tokens para evitar duplicación de estilos y lógica
- `RNF-SEG-01` — Toda comunicación debe usar HTTPS en producción; el token viaja en Authorization: Bearer
- `RNF-SEG-02` — Contraseñas con hash bcrypt y tokens Sanctum almacenados solo como hash
- `RNF-SEG-03` — La contraseña del usuario no debe aparecer en ninguna respuesta de la API
- `RNF-SEG-04` — Toda ruta exige autenticación (`auth:sanctum`) salvo el login; operaciones sensibles con middleware admin y Policies
- `RNF-SEG-05` — Validar toda entrada con Form Requests (tipo, formato, tamaño, unicidad) antes de tocar el modelo
- `RNF-SEG-06` — Validar el MIME real en todos los endpoints de subida de archivos
- `RNF-SEG-07` — Rate-limiting del login: 5 intentos por minuto por IP y correo
- `RNF-SEG-08` — Tokens revocables por dispositivo (logout o gestión administrativa)
- `RNF-SEG-09` — Errores de credenciales genéricos que no revelen la existencia del correo
- `RNF-UXA-01` — Cumplir WCAG nivel AA (contraste, foco visible, aria-label en controles solo-icono)
- `RNF-UXA-02` — Errores de formulario por campo, con foco al primer campo inválido
- `RNF-UXA-03` — Interfaz responsive, con sidebar tipo drawer en móvil y chat usable en pantallas pequeñas
- `RNF-UXA-05` — Estados vacíos ilustrados y consistentes, con llamado a la acción contextual
- `RNF-UXA-06` — Mensajes de error 4xx/5xx claros y con microcopy de marca Coherev
- `RNF-UXA-07` — Julián Tapia

### Requerimientos sin caso de prueba asignado

Cubren la base de código y la experiencia de uso, y se validan en los casos no funcionales CP-029 a CP-034 o en la revisión manual:

- `RF-AUT-01` — Autenticar al usuario mediante correo corporativo y contraseña en POST /login
- `RF-AUT-07` — Enviar el token en cada petición protegida mediante Authorization: Bearer (Sanctum PAT)
- `RF-CHT-07` — Autorizar la suscripción al canal solo a los participantes de la conversación
- `RF-CHT-11` — Permitir solo al Administrador eliminar mensajes y conversaciones
- `RF-DEP-03` — Listar y crear carpetas documentales por departamento
- `RF-DEP-04` — Permitir subir documentos a una carpeta de departamento
- `RF-DOC-05` — Almacenar archivos en carpetas funcionales del disco público (announcements, documents/department, documents/chat)
- `RF-FUT-01` — Módulo Tareas: tablero Kanban interno por equipo, visible para Líderes y Administradores
- `RF-FUT-02` — Módulo Directorio: vista pública de colaboradores
- `RF-FUT-03` — Panel de Novedades: contenido destacado para el rol Nuevo Ingreso
- `RF-FUT-04` — Búsqueda global por usuarios, documentos y mensajes
- `RF-FUT-05` — Notificaciones push para anuncios y mensajes
- `RF-FUT-06` — Auditoría y logs de actividad por usuario
- `RF-ROL-01` — Modelar los 4 roles del negocio: Administrador, Líder, Colaborador y Nuevo Ingreso, precargados por seeder
- `RF-ROL-04` — Centralizar el permiso de publicación (`canManageAnnouncements`) por rol y cubrirlo con tests
- `RNF-DISP-01` — Funcionamiento en entorno local y despliegue sin dependencias de terceros pagados
- `RNF-DISP-02` — Capa de tiempo real con Reverb como servidor principal y Pusher como fallback configurable
- `RNF-DISP-03` — Base de datos MariaDB (compatible MySQL) accedida exclusivamente mediante Eloquent
- `RNF-DISP-04` — Compatibilidad con navegadores modernos (Chrome, Edge y Firefox en sus últimas 2 versiones)
- `RNF-MANT-01` — Backend en patrón MVC por capas: controladores delgados, Form Requests y API Resources
- `RNF-MANT-02` — Reglas de negocio en modelos y Policies, no en controladores
- `RNF-MANT-04` — Código consistente con Laravel Pint y las convenciones del monorepo
- `RNF-MANT-05` — Documentación mantenida del proyecto (API, arquitectura, esquema ER, trazabilidad)
- `RNF-MANT-06` — Integraciones externas concentradas en la carpeta `lib/` del frontend
- `RNF-MANT-07` — Versionado público de la API planificado a futuro (/api/v1, /api/v2)
- `RNF-REN-01` — Paginación de historiales de mensajes y listados grandes
- `RNF-REN-02` — Eager loading en las consultas para evitar el problema N+1
- `RNF-REN-06` — Reutilización de componentes y tokens para evitar duplicación de estilos y lógica
- `RNF-SEG-01` — Toda comunicación debe usar HTTPS en producción; el token viaja en Authorization: Bearer
- `RNF-SEG-02` — Contraseñas con hash bcrypt y tokens Sanctum almacenados solo como hash
- `RNF-SEG-05` — Validar toda entrada con Form Requests (tipo, formato, tamaño, unicidad) antes de tocar el modelo
- `RNF-UXA-07` — Julián Tapia

## 5. Referencias

- Requerimientos: [REQUIREMENTS.md](REQUIREMENTS.md)
- Historias de usuario: [USER_STORIES.md](USER_STORIES.md)
- Esquema de datos: [DATABASE.md](DATABASE.md)
- Casos de prueba: `docs/Fase 2.2/2-Casos de prueba.pdf`
- Registro de defectos: `docs/Fase 2.2/3-Defectos por ciclos.pdf`
- Checklist de término: `docs/Fase 2.2/6-Checklist de termino del proyecto.md`
