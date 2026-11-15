## Índice de contenido

<!-- pagebreak -->

# Ficha del documento

## Convenciones

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Etapa | Fase 2.2 — Cierre de proyecto |
| Versión | 1.2 |
| Fecha de emisión | 15 de noviembre de 2026 |
| Fecha de la verificación técnica | 15 de noviembre de 2026 |
| Fecha de cierre planificada | 20 de diciembre de 2026 (semana 18) |
| Integrantes | Benjamín Herrera (Backend) / Julián Tapia (Frontend) |
| Docente guía | Cindy Betzabé Contador Cisterna |
| Plan de pruebas | 1-Plan de pruebas |
| Casos de prueba | 2-Casos de prueba |
| Registro de defectos | 3-Defectos por ciclos |

### Marcas de estado

| Marca | Significado |
| --- | --- |
| [x] | Completado con evidencia verificable |
| [~] | Parcial: avance real pero con pendiente por cerrar |
| [ ] | Pendiente: no iniciado o no verificable a la fecha de emisión |
| [—] | No aplica por decisión de alcance documentada |

Estado global a la fecha de emisión (15 de noviembre de 2026): la parte de construcción y documentación técnica está esencialmente cerrada y fue verificada de nuevo sobre el commit 6b15daa (133 pruebas automatizadas en verde, tipado, linter y compilación sin errores, handshake WebSocket 101 y contrato de la API correcto). La parte de verificación formal, validación con usuarios reales y aceptación sigue pendiente de ejecución: la campaña de pruebas arranca el 16 de noviembre de 2026. La verificación técnica detectó dos defectos nuevos en el tiempo real (DEF-032 y DEF-033) que impiden declarar cumplidos RF-CHT-06 y RF-CHT-07.

## Resumen por bloque

| Bloque | Completado | Parcial | Pendiente | No aplica |
| --- | --- | --- | --- | --- |
| 1. Requisitos implementados | 66 | 8 | 12 | 0 |
| 2. Pruebas completadas | 7 | 0 | 40 | 0 |
| 3. Manuales entregados | 25 | 2 | 0 | 0 |
| 4. Documentación actualizada (Git) | 8 | 2 | 1 | 0 |
| 5. Entorno de producción operativo | 8 | 1 | 0 | 7 |
| 6. Capacitación realizada | 0 | 1 | 1 | 1 |
| 7. Validación y aceptación del cliente | 0 | 0 | 9 | 0 |
| 8. Cierre administrativo del proyecto | 1 | 0 | 11 | 0 |
| **Total de ítems** | **115** | **14** | **74** | **8** |

Se verificaron 211 ítems en total: 115 completados, 14 parciales, 74 pendientes y 8 no aplicables. El cumplimiento global es del 54,5 %.

## Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 13 de noviembre de 2026 | Emisión inicial sobre el estado del repositorio a esa fecha |
| 1.1 | 15 de noviembre de 2026 | Registro de verificación del entorno (§5.3) completo; cifras del repositorio corregidas (53 → 56 commits, 460 → 468 aserciones, 22 → 20 archivos de prueba); RF-CHT-06 y RF-CHT-07 degradados a [~] por DEF-032 y DEF-033; árbol de trabajo marcado como limpio; fuente Markdown y script de generación añadidos |
| 1.2 | 15 de noviembre de 2026 | Tipografía Calibri, como el resto de la documentación del proyecto; escritos los cinco documentos prometidos en §3.1 (DATABASE, REQUIREMENTS, USER_STORIES, TRACEABILITY, VOICE_TONE) y el índice de docs/evidence/; recuento de ítems actualizado |

<!-- pagebreak -->

# 1. Todos los requisitos implementados

## 1.1 Requerimientos funcionales (RF)

Autenticación y sesión — RF-AUT

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-AUT-01 | Autenticar al usuario mediante correo corporativo y contraseña en POST /login | `AuthController::login` | `routes/api.php`, `AppServiceProvider` |
| [x] | RF-AUT-02 | Permitir «mantener la sesión iniciada»: token en localStorage o sessionStorage según la preferencia | `lib/auth-token.ts` | `frontend/lib/auth-token.ts` |
| [x] | RF-AUT-03 | Limitar el login a 5 intentos por minuto por IP y correo, respondiendo 429 al superar el límite | `Limit::perMinute(5)->by(ip\|email)` | `app/Providers/AppServiceProvider.php`, `LoginRateLimitTest` |
| [x] | RF-AUT-04 | Responder con mensaje genérico ante credenciales inválidas sin revelar si el correo existe | Frontend + backend | `app/page.tsx`, CP-002, CP-003 |
| [x] | RF-AUT-05 | Validar la sesión en GET /me devolviendo el usuario con sus roles y permisos | `AuthController::me` | `routes/api.php`, CP-007 |
| [x] | RF-AUT-06 | Revocar el token del dispositivo al cerrar sesión (POST /logout) y limpiar el almacenamiento del cliente | `AuthController::logout` | `routes/api.php`, CP-008 |
| [x] | RF-AUT-07 | Enviar el token en cada petición protegida mediante Authorization: Bearer (Sanctum PAT) | `lib/api-client.ts` | `frontend/lib/api-client.ts` |
| [x] | RF-AUT-08 | Responder 401 ante token inválido o expirado; el frontend limpia la sesión y redirige al login | `api-client.ts` | `frontend/lib/api-client.ts`, CP-010 |

Usuarios — RF-USR

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-USR-01 | Solo un Administrador puede listar, ver, crear, editar y eliminar usuarios | `UserController` + middleware admin | `routes/api.php`, `UserAuthorizationTest` |
| [x] | RF-USR-02 | Crear usuarios con nombre, correo corporativo único y contraseña de mínimo 8 caracteres confirmada | `StoreUserRequest` | CP-028 |
| [x] | RF-USR-03 | Permitir la asignación de roles a un usuario (PUT /users/{user}/roles) | `UserRoleController` | `routes/api.php`, CP-028 |
| [x] | RF-USR-04 | Asociar cada usuario a un departamento | Migración `department_user` | `2026_11_08_000001`, `UserDepartmentsTest` |
| [x] | RF-USR-05 | Rechazar con 403 cualquier operación de gestión de usuarios por un usuario sin rol Administrador | Middleware admin | `UserAuthorizationTest`, CP-011 |

Roles y permisos — RF-ROL

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-ROL-01 | Modelar los 4 roles del negocio: Administrador, Líder, Colaborador y Nuevo Ingreso, precargados por seeder | `app/Models/Role.php` | `RoleSeeder`, `RoleSeederTest` |
| [x] | RF-ROL-02 | Permitir solo al Administrador crear, editar y eliminar roles; lectura abierta para autenticados | `RoleController` | `RoleAuthorizationTest`, CP-013 |
| [x] | RF-ROL-03 | Asociar cada rol a un departamento y exponer el permiso booleano `can_post_announcements` | `roles.department_id` | `2026_04_20_000001`, CP-013 |
| [x] | RF-ROL-04 | Centralizar el permiso de publicación (`canManageAnnouncements`) por rol y cubrirlo con tests | `User::canManageAnnouncements()` | `CanManageAnnouncementsCentralizedTest` |
| [x] | RF-ROL-05 | Adaptar sidebar y rutas según el rol: Novedades (Nuevo Ingreso), Tareas (Líder), chat y documentos (Colaborador) y todo (Administrador) | `NAV_ITEMS` | `components/dashboard-sidebar.tsx`, CP-029 |

Departamentos y carpetas — RF-DEP

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-DEP-01 | Solo el Administrador puede crear, editar y eliminar departamentos; los Líderes solo pueden verlos | `DepartmentController` | `DepartmentAuthorizationTest`, CP-012 |
| [x] | RF-DEP-02 | Al eliminar un departamento, eliminar en cascada sus roles asociados | `DepartmentController::destroy` | CP-012 |
| [x] | RF-DEP-03 | Listar y crear carpetas documentales por departamento | `DepartmentFolderController` | `routes/api.php` |
| [x] | RF-DEP-04 | Permitir subir documentos a una carpeta de departamento | `DocumentController::storeDepartmentDocument` | `routes/api.php` |

Chat en tiempo real — RF-CHT

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-CHT-01 | Listar las conversaciones en las que participa el usuario autenticado | `ConversationController::index` | CP-015 |
| [x] | RF-CHT-02 | Crear conversaciones privadas (1 usuario) o grupales (2 o más), calculando el tipo automáticamente | `ConversationController::store` | CP-016 |
| [x] | RF-CHT-03 | Entregar el historial solo a participantes de la conversación (403 en caso contrario) | `MessageController::index` | CP-017 |
| [x] | RF-CHT-04 | Permitir el envío de mensajes de texto | `MessageController::store` | CP-018 |
| [x] | RF-CHT-05 | Permitir adjuntos de hasta 20 MB en los mensajes | `StoreMessageRequest` | CP-020 |
| [~] | RF-CHT-06 | Entregar mensajes en tiempo real vía WebSocket (Reverb, con Pusher como fallback) en canal privado `conversation.{id}` | `MessageSent` + `routes/channels.php` | **Parcial.** Reverb operativo y handshake 101 Switching Protocols verificado el 15 nov 2026, pero la entrega no se produce: el frontend se suscribe a `conversations.{id}` y el backend emite y autoriza `conversation.{id}`. Hallazgo DEF-032 |
| [~] | RF-CHT-07 | Autorizar la suscripción al canal solo a los participantes de la conversación | `Broadcast::channel` | **Parcial.** La política (participante o Administrador) está implementada, pero `POST /broadcasting/auth` responde 403 a un token válido: la ruta se registra con middleware `web` y `config/auth.php` solo define el guard `web`, de modo que el guard `sanctum` no llega a invocarse. Hallazgo DEF-033 |
| [x] | RF-CHT-08 | Registrar la lectura de mensajes en la tabla `message_reads` al abrir una conversación | `ConversationController::markAsRead` | `MessageReadTest`, CP-019 |
| [x] | RF-CHT-09 | Calcular el contador de no leídos desde la base de datos, no desde el cliente | `ConversationController::index` | `MessageReadTest`, CP-019 |
| [x] | RF-CHT-10 | Sincronizar el estado del chat entre pestañas del mismo usuario (BroadcastChannel) | `lib/session-context.tsx` | CP-019, CP-033 |
| [x] | RF-CHT-11 | Permitir solo al Administrador eliminar mensajes y conversaciones | Middleware admin | `routes/api.php`, `AdminConversationAccessTest` |

Publicaciones y comentarios — RF-PUB

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-PUB-01 | Mostrar publicaciones según su visibilidad y el departamento o rol del usuario | `AnnouncementController` + `AnnouncementPolicy` | `AnnouncementAuthorizationTest`, CP-021 |
| [x] | RF-PUB-02 | Permitir crear publicaciones solo a usuarios con permiso `can_post_announcements` | `User::canManageAnnouncements()` | `CanManageAnnouncementsCentralizedTest`, CP-021 |
| [x] | RF-PUB-03 | Editar y eliminar publicaciones según la `AnnouncementPolicy` (creador o Administrador) | `AnnouncementPolicy` | CP-024 |
| [x] | RF-PUB-04 | Permitir adjuntar archivos a una publicación y descargarlos | `AnnouncementController::downloadAttachment` | CP-022 |
| [x] | RF-PUB-05 | Validar el MIME real de los adjuntos antes de almacenarlos | `RejectsMimeMismatch` | `MimeValidationTest`, CP-014 |
| [x] | RF-PUB-06 | Permitir comentar publicaciones visibles del propio departamento | `CommentController::store` | `CommentTest`, CP-023 |
| [x] | RF-PUB-07 | Eliminar un comentario por su autor o, según política, por el Administrador o creador de la publicación | `CommentController::destroy` | `CommentTest`, CP-023 |

Documentos — RF-DOC

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [x] | RF-DOC-01 | Listar y mostrar documentos según su visibilidad (public, department, private) | `DocumentController` + `DocumentPolicy` | `DocumentAuthorizationTest`, CP-025 |
| [x] | RF-DOC-02 | Subir, editar y eliminar documentos solo por su dueño o un Administrador | `DocumentPolicy::canMutate` | CP-026 |
| [x] | RF-DOC-03 | Permitir la descarga de documentos autorizados | `DocumentController::download` | CP-025 |
| [x] | RF-DOC-04 | Validar el MIME real de los archivos, rechazando con 415 los que no coincidan | `RejectsMimeMismatch` | `MimeValidationTest`, CP-014 |
| [x] | RF-DOC-05 | Almacenar archivos en carpetas funcionales del disco público (announcements, documents/department, documents/chat) | `config/filesystems.php` | `PublicStorageTest` |

Módulos previstos — RF-FUT

|  | ID | Requerimiento | Módulo o archivo | Evidencia |
| --- | --- | --- | --- | --- |
| [ ] | RF-FUT-01 | Módulo Tareas: tablero Kanban interno por equipo, visible para Líderes y Administradores | `app/dashboard/tasks/page.tsx` | Solo existe la vista con el aviso de módulo no habilitado (MOD-001 del backlog). Sin backend |
| [ ] | RF-FUT-02 | Módulo Directorio: vista pública de colaboradores | — | No iniciado (MOD-002). No hay ruta ni vista en `frontend/app/dashboard/` |
| [ ] | RF-FUT-03 | Panel de Novedades: contenido destacado para el rol Nuevo Ingreso | — | No iniciado (MOD-003) |
| [ ] | RF-FUT-04 | Búsqueda global por usuarios, documentos y mensajes | Búsqueda por módulo | Fuera del alcance priorizado (roadmap) |
| [ ] | RF-FUT-05 | Notificaciones push para anuncios y mensajes | — | Fuera del alcance priorizado (roadmap) |
| [ ] | RF-FUT-06 | Auditoría y logs de actividad por usuario | — | Fuera del alcance priorizado (roadmap) |

> Bloqueante del acta de constitución. El criterio de aceptación del proyecto exige «10/10 módulos operativos al cierre de la Iter 2». Hoy hay 7 de 10. Los tres módulos pendientes (Tareas, Directorio, Novedades) son el único incumplimiento abierto del alcance funcional y deben resolverse o declararse formalmente fuera de alcance con el aval de la docente guía antes del cierre.

## 1.2 Requerimientos no funcionales (RNF)

|  | ID | Requerimiento | Evidencia / observación |
| --- | --- | --- | --- |
| [x] | RNF-SEG-01 | Toda comunicación debe usar HTTPS en producción; el token viaja en Authorization: Bearer | Parcial. El token viaja correctamente en el encabezado — verificado el 15 nov 2026: `GET /api/me` con `Authorization: Bearer` responde 200. HTTPS solo aplica en producción, que está fuera del alcance del proyecto. Verificar en la instalación final |
| [x] | RNF-SEG-02 | Contraseñas con hash bcrypt y tokens Sanctum almacenados solo como hash | `config/auth.php`, bcrypt con `BCRYPT_ROUNDS=12` |
| [x] | RNF-SEG-03 | La contraseña del usuario no debe aparecer en ninguna respuesta de la API | `User` no expone password; CP-007 lo verifica |
| [x] | RNF-SEG-04 | Toda ruta exige autenticación (`auth:sanctum`) salvo el login; operaciones sensibles con middleware admin y Policies | `routes/api.php`; CP-009, CP-011 |
| [x] | RNF-SEG-05 | Validar toda entrada con Form Requests (tipo, formato, tamaño, unicidad) antes de tocar el modelo | `app/Http/Requests/`; migrado en DEF-030 |
| [x] | RNF-SEG-06 | Validar el MIME real en todos los endpoints de subida de archivos | `RejectsMimeMismatch`; `MimeValidationTest` |
| [x] | RNF-SEG-07 | Rate-limiting del login: 5 intentos por minuto por IP y correo | `AppServiceProvider`; `LoginRateLimitTest`; verificado el 15 nov 2026 (la API responde 429 al superar el límite) |
| [x] | RNF-SEG-08 | Tokens revocables por dispositivo (logout o gestión administrativa) | `AuthController::logout`; CP-008 |
| [x] | RNF-SEG-09 | Errores de credenciales genéricos que no revelen la existencia del correo | CP-002, CP-003; verificado el 15 nov 2026 (login inválido responde 422 «Credenciales inválidas.» sin distinguir el caso de correo inexistente) |
| [x] | RNF-REN-01 | Paginación de historiales de mensajes y listados grandes | Paginación en Documentos (12/pág.), Usuarios (15/pág.) y feed por tandas |
| [x] | RNF-REN-02 | Eager loading en las consultas para evitar el problema N+1 | `AnnouncementController` eager-loads attachments; `UserDepartmentsTest` |
| [ ] | RNF-REN-03 | Tiempo de respuesta menor a 500 ms en el 95 % de las peticiones de lectura | Pendiente de medición formal. Caso CP-032 |
| [ ] | RNF-REN-04 | Notificación de un mensaje en tiempo real en menos de 500 ms desde su envío | Pendiente de medición formal y bloqueado: la entrega en vivo no se produce (DEF-032 y DEF-033), de modo que no hay latencia que medir. Caso CP-018 |
| [ ] | RNF-REN-05 | Dashboard con contenido inicial (LCP) por debajo de 2,5 s en hardware representativo | Pendiente de medición formal. Caso CP-032 |
| [x] | RNF-REN-06 | Reutilización de componentes y tokens para evitar duplicación de estilos y lógica | `components/`, `lib/`, tokens CSS en `app/globals.css` |
| [~] | RNF-UXA-01 | Cumplir WCAG nivel AA (contraste, foco visible, aria-label en controles solo-icono) | Parcial. Foco visible, aria-label y contraste verificado en el commit 04d7a70; falta la auditoría con axe-core (no declarado como dependencia). Caso CP-033 |
| [~] | RNF-UXA-02 | Errores de formulario por campo, con foco al primer campo inválido | Parcial. Falta el mapa de errores del servidor a cada input (tarjeta UX-003). Caso CP-034 |
| [~] | RNF-UXA-03 | Interfaz responsive, con sidebar tipo drawer en móvil y chat usable en pantallas pequeñas | Parcial. El drawer existe (`lib/mobile-nav-store.ts`, `lib/use-mobile-nav.ts`) y funciona con Esc y clic fuera; falta cerrar la tarjeta UX-001/UX-004. Caso CP-033 |
| [x] | RNF-UXA-04 | Onboarding guiado para nuevos usuarios (driver.js) en un tour de hasta 5 pasos | `lib/help-tours.ts` con 5 recorridos; CP-031 |
| [~] | RNF-UXA-05 | Estados vacíos ilustrados y consistentes, con llamado a la acción contextual | Parcial. La vista de Papelera ya tiene su estado vacío; falta el componente EmptyState reutilizable en el resto de páginas (tarjeta BRAND-010) |
| [~] | RNF-UXA-06 | Mensajes de error 4xx/5xx claros y con microcopy de marca Coherev | Parcial. Los mensajes de login y el 429 están escritos; falta el reescriturado completo de errores (tarjeta BRAND-007). Caso CP-034 |
| [ ] | RNF-UXA-07 | Un usuario nuevo debe completar las tareas principales en su primera sesión sin asistencia | Pendiente. Depende de la validación con usuarios reales (hito M4) |
| [x] | RNF-MANT-01 | Backend en patrón MVC por capas: controladores delgados, Form Requests y API Resources | Estructura de `backend/app/`; corregido en DEF-030 |
| [x] | RNF-MANT-02 | Reglas de negocio en modelos y Policies, no en controladores | `app/Policies/`, `app/Models/User.php` |
| [x] | RNF-MANT-03 | Cobertura de la funcionalidad crítica con tests PHPUnit; sin romper la suite existente | 133 pruebas / 468 aserciones en verde, 256,47 s (15 nov 2026), 20 archivos de prueba (19 Feature + 1 Unit) |
| [x] | RNF-MANT-04 | Código consistente con Laravel Pint y las convenciones del monorepo | Commit 6726b45 (formato con Pint) |
| [~] | RNF-MANT-05 | Documentación mantenida del proyecto (API, arquitectura, esquema ER, trazabilidad) | Parcial. Faltan seis archivos prometidos por el documento de arquitectura: `DATABASE.md`, `REQUIREMENTS.md`, `USER_STORIES.md`, `TRACEABILITY.md`, `VOICE_TONE.md` y `evidence/` (§3.1). Desde la v1.1, este checklist tiene además fuente Markdown regenerable |
| [x] | RNF-MANT-06 | Integraciones externas concentradas en la carpeta `lib/` del frontend | `lib/api-client.ts`, `lib/auth-token.ts`, `lib/echo-client.ts`, `lib/attachment-url.ts` |
| [ ] | RNF-MANT-07 | Versionado público de la API planificado a futuro (/api/v1, /api/v2) | Fuera del alcance priorizado (roadmap) |

Disponibilidad, compatibilidad y portabilidad — RNF-DISP

|  | ID | Requerimiento | Evidencia / observación |
| --- | --- | --- | --- |
| [x] | RNF-DISP-01 | Funcionamiento en entorno local y despliegue sin dependencias de terceros pagados | Entorno local verificado; costo total de licencias $0 CLP según 2-acta de constitucion |
| [x] | RNF-DISP-02 | Capa de tiempo real con Reverb como servidor principal y Pusher como fallback configurable | `config/reverb.php`, `lib/echo-client.ts`, variables `NEXT_PUBLIC_PUSHER_*`. Transporte verificado el 15 nov 2026 (handshake 101); la autorización del canal privado está bloqueada por DEF-033 |
| [x] | RNF-DISP-03 | Base de datos MariaDB (compatible MySQL) accedida exclusivamente mediante Eloquent | `DB_CONNECTION=mariadb`; los 11 modelos usan Eloquent. La única excepción es un `selectRaw` en `ConversationController` para agregar el contador de no leídos |
| [ ] | RNF-DISP-04 | Compatibilidad con navegadores modernos (Chrome, Edge y Firefox en sus últimas 2 versiones) | Pendiente de verificación formal en la campaña. Caso CP-033 |
| [x] | RNF-DISP-05 | Persistencia del token según preferencia (localStorage o sessionStorage) | `lib/auth-token.ts`; casos CP-005 y CP-006 |
| [x] | RNF-DISP-06 | Invalidación de la sesión en todas las pestañas al recibir un 401 en cualquiera | `lib/session-context.tsx`; caso CP-010 |

## 1.3 Resumen de cumplimiento funcional

| Dimensión | Total | Implementado | Parcial | Pendiente | % de cumplimiento |
| --- | --- | --- | --- | --- | --- |
| Requerimientos funcionales dentro del alcance (RF-AUT, RF-USR, RF-ROL, RF-DEP, RF-CHT, RF-PUB, RF-DOC) | 45 | 43 | 2 | 0 | 95,6 % |
| Módulos previstos (RF-FUT-01…RF-FUT-03) | 3 | 0 | 0 | 3 | 0 % |
| Funcionalidad de roadmap (RF-FUT-04…RF-FUT-06) | 3 | 0 | 0 | 3 | 0 % (fuera de alcance) |
| Requerimientos no funcionales (RNF-SEG, RNF-REN, RNF-UXA, RNF-MANT, RNF-DISP) | 35 | 23 | 6 | 6 | 66 % |
| **Total de requerimientos** | **86** | **66** | **8** | **12** | **76,7 %** |

<!-- pagebreak -->

# 2. Pruebas completadas

Sección intencionalmente vacía en cuanto a resultados. Las pruebas formales no se han ejecutado todavía. La campaña se ejecuta entre el 16 de noviembre y el 20 de diciembre de 2026 según el 1-Plan de pruebas, y sus resultados se registran en 2-Casos de prueba (estado, resultado obtenido) y en 3-Defectos por ciclos (defectos generados).

## 2.1 Lo que sí existe a la fecha de emisión

| Ítem | Estado | Evidencia |
| --- | --- | --- |
| Suite automatizada de PHPUnit | [x] Verde | `php artisan test` → 133 passed (468 assertions), 256,47 s, 15 nov 2026 |
| Archivos de prueba automatizada | [x] 20 archivos | `backend/tests/` (19 Feature + 1 Unit) |
| Plan de pruebas redactado y aprobado | [x] | 1-Plan de pruebas |
| Casos de prueba redactados | [x] | 2-Casos de prueba — 34 casos en 6 bloques de módulo |
| Registro de defectos estructurado | [x] | 3-Defectos por ciclos — 31 defectos, 30 cerrados |
| Defectos detectados en los ciclos 1 a 3 | [x] | Commits d29bc87 … 52f01a3 |
| Verificación técnica del entorno re-ejecutada | [x] | Tipado, linter, compilación, contrato de la API y handshake WebSocket — ver §5.3 |

## 2.2 Pendiente de la campaña

| Ítem | Estado | Fecha objetivo |
| --- | --- | --- |
| Ciclo 0 — Pruebas del núcleo (CP-001…CP-014) | [ ] | 16 – 22 nov 2026 |
| Ciclo 1 — Pruebas de módulos (CP-015…CP-028) | [ ] | 23 – 29 nov 2026 |
| Ciclo 2 — Pruebas no funcionales (CP-029…CP-034) | [ ] | 30 nov – 4 dic 2026 |
| Ciclo 3 — Retest, regresión y validación con usuarios | [ ] | 7 – 11 dic 2026 |
| Acta de pruebas firmada | [ ] | 16 dic 2026 |
| Cierre de la campaña con 0 defectos Críticos/Altos abiertos | [ ] | 16 dic 2026 |

## 2.3 Registro de ejecución

Por completar al cierre de cada ciclo. El resultado esperado de cada caso está en 2-Casos de prueba; esta tabla registra el resultado obtenido, el estado y el defecto asociado. Los 34 casos se distribuyen así: Ciclo 0 (CP-001…CP-014, núcleo y control de acceso), Ciclo 1 (CP-015…CP-028, módulos), Ciclo 2 (CP-029…CP-034, atributos no funcionales) y Ciclo 3 (retest y regresión, sin casos nuevos).

| ID del caso | Resultado obtenido | Estado | Defecto asociado |
| --- | --- | --- | --- |
| CP-001 |  | Pendiente | — |
| CP-002 |  | Pendiente | — |
| CP-003 |  | Pendiente | — |
| CP-004 |  | Pendiente | — |
| CP-005 |  | Pendiente | — |
| CP-006 |  | Pendiente | — |
| CP-007 |  | Pendiente | — |
| CP-008 |  | Pendiente | — |
| CP-009 |  | Pendiente | — |
| CP-010 |  | Pendiente | — |
| CP-011 |  | Pendiente | — |
| CP-012 |  | Pendiente | — |
| CP-013 |  | Pendiente | — |
| CP-014 |  | Pendiente | — |
| CP-015 |  | Pendiente | — |
| CP-016 |  | Pendiente | — |
| CP-017 |  | Pendiente | — |
| CP-018 |  | Pendiente | — |
| CP-019 |  | Pendiente | — |
| CP-020 |  | Pendiente | — |
| CP-021 |  | Pendiente | — |
| CP-022 |  | Pendiente | — |
| CP-023 |  | Pendiente | — |
| CP-024 |  | Pendiente | — |
| CP-025 |  | Pendiente | — |
| CP-026 |  | Pendiente | — |
| CP-027 |  | Pendiente | — |
| CP-028 |  | Pendiente | — |
| CP-029 |  | Pendiente | — |
| CP-030 |  | Pendiente | — |
| CP-031 |  | Pendiente | — |
| CP-032 |  | Pendiente | — |
| CP-033 |  | Pendiente | — |
| CP-034 |  | Pendiente | — |

<!-- pagebreak -->

# 3. Manuales entregados

|  | Documento | Ubicación | Observación |
| --- | --- | --- | --- |
| [x] | Plan de pruebas | `docs/Fase 2.2/1-Plan de pruebas.pdf` | Objetivos, alcance, tipos, recursos, criterios de entrada/salida y cronograma |
| [x] | Casos de prueba | `docs/Fase 2.2/2-Casos de prueba.pdf` | 34 casos con los 9 campos solicitados |
| [x] | Registro de defectos por ciclos | `docs/Fase 2.2/3-Defectos por ciclos.pdf` | 31 defectos con ciclo, severidad, estado, responsable y evidencia |
| [x] | Manual de usuario final | `docs/Fase 2.2/4-Manual de usuario final.pdf` | 15 capturas indicadas por vista, 13 procedimientos y 30 soluciones de problemas |
| [x] | Manual de implementación | `docs/Fase 2.2/5-Manual de implementacion.pdf` | Infraestructura, instalación, variables, dependencias, verificación y rollback |
| [x] | Checklist de término del proyecto | `docs/Fase 2.2/6-Checklist de termino del proyecto.md` y `.pdf` | Este documento (v1.2) |
| [x] | Documento de arquitectura de software | `docs/Fase 2.1/14-documento arquitectura de software.docx` | 15 secciones, modelo 4+1, 7 decisiones de diseño, 8 riesgos |
| [x] | Requerimientos funcionales y no funcionales | `docs/Fase 2.1/8 y 9-requerimientos F y NF.docx` | 51 RF y 35 RNF numerados |
| [x] | Historias de usuario | `docs/Fase 2.1/10-historias de usuario.docx` | 13 historias, 3 o más por rol |
| [x] | Ficha instructiva del proyecto | `docs/Fase 2.1/1-ficha del proyecto.docx` | Identificación, objetivos, alcance, stack, entregables |
| [x] | Acta de constitución del proyecto | `docs/Fase 2.1/2-acta de constitucion.docx` | Alcance, riesgos, stakeholders, cronograma, criterios de aceptación |
| [x] | Mapa de actores | `docs/Fase 2.1/4-mapa de actores.docx` | Actores y roles del sistema |
| [x] | Product vision / goal / roadmap | `docs/Fase 2.1/5-…`, `6-…`, `7-…` | Propósito, objetivos y hoja de ruta de producto |
| [x] | Product backlog | `docs/Fase 2.1/11-product backlog.xlsx` | 35 tarjetas, 6 épicas, 7 iteraciones |
| [x] | Registro de stakeholders | `docs/Fase 2.1/3-registro de stakeholders.xlsx` | Actores afectados por el proyecto |
| [x] | Esquema SQL y diagrama ER | `docs/Fase 2.1/15.1-…sql`, `15-…pdf` | 33 migraciones consolidadas |
| [~] | Plan de hitos y entregables | No versionado en el repositorio | El plan M0 a M6 con el estado real se conserva fuera del control de versiones. Su estado actual se resume en este documento |
| [x] | README del repositorio | `intranet/README.md` | Arquitectura general, stack y referencia al knowledge graph |
| [x] | Documentación de la API | `backend/API_NEXTJS.md`, `frontend/API_NEXTJS.md` | Contrato de endpoints para el cliente |
| [x] | README de instalación del backend | `backend/README.md` | Instalación, seeders y usuarios de prueba |
| [x] | README de instalación del frontend | `frontend/README.md` | Variables de entorno y troubleshooting |

> Los seis entregables de la Fase 2.2 se distribuyen como PDF. Desde la v1.1, el sexto tiene además fuente Markdown regenerable; los otros cinco conservan solo su PDF.

## 3.1 Documentos prometidos en `docs/`

|  | Documento | Prometido en | Observación |
| --- | --- | --- | --- |
| [x] | `docs/DATABASE.md` | Plan de hitos y entregables (M3) y 14-documento arquitectura de software | Escrito el 15 nov 2026: inventario de las 23 tablas con sus columnas, foráneas e índices, el mapa de relaciones y las 33 migraciones |
| [x] | `docs/REQUIREMENTS.md` | Ídem | Los 51 RF y los 35 RNF en Markdown, con la referencia al `.docx` de la Fase 2.1 como fuente canónica |
| [x] | `docs/USER_STORIES.md` | Ídem | Las 13 historias con sus criterios de aceptación y los RF asociados a cada una |
| [x] | `docs/TRACEABILITY.md` | Ídem | Matriz Problema → RF → HU → Funcionalidad → Prueba sobre las 86 filas de requerimientos |
| [x] | `docs/VOICE_TONE.md` | Ídem | Voz de la marca, patrones de mensaje de error, glosario y tokens visuales |
| [~] | `docs/evidence/` | Ídem | El índice de la carpeta existe y detalla qué evidencia debe incorporarse y en qué formato. Faltan las capturas del tablero (EVI-001) y el acta de usabilidad (EVI-002) |

Los seis archivos estaban prometidos explícitamente por el documento de arquitectura que ya está entregado. Su ausencia era una inconsistencia documentada, registrada como riesgo R5 en el plan de hitos y entregables. Con la v1.2, cinco quedan resueltos; `docs/evidence/` sigue parcial porque depende de actividades —capturas del tablero y sesión con usuarios reales— que todavía no se han realizado y que no se pueden documentar sin que ocurran.

<!-- pagebreak -->

# 4. Documentación actualizada (Git)

|  | Ítem | Estado | Evidencia |
| --- | --- | --- | --- |
| [x] | Repositorio Git único con `backend/` y `frontend/` | Completado | github.com/Aron1244/intranet |
| [x] | Historial de commits trazable por tarjeta | Completado | 56 commits en el commit verificado (6b15daa); el mensaje incluye el ID de la tarjeta (SEC-003: …, ROL-002: …, BRAND-…) |
| [x] | Convención de commits | Completado | Conventional Commits (feat, fix, docs, refactor, chore, build, test) |
| [x] | Integración por pull request con revisión del otro integrante | Completado | PR #1 mergeado con revisión cruzada (fa11f34) |
| [x] | Ramas de trabajo definidas | Completado | develop (activa, 56 commits en el commit verificado) y main |
| [x] | .gitignore correcto | Completado | node_modules/, graphify-out/, .env y artefactos de generación |
| [x] | Knowledge graph del proyecto consultable | Completado | `graphify-out/` (local, regenerable); graph.json con ≈1670 nodos, 3006 aristas, 143 comunidades |
| [~] | README raíz, BACKLOG.md y ROADMAP.md unificados con el nombre oficial | Parcial | El README raíz ya dice Coherev (commit bd23e73). No se pudo verificar BACKLOG.md ni ROADMAP.md: no existen como archivo Markdown en el repositorio, cuya fuente de verdad es Fase 2.1/11-product backlog.xlsx (tarjeta EVI-005) |
| [~] | Documentación del repositorio en docs/ completa y coherente | Parcial | Los cinco documentos de §3.1 están escritos; falta la evidencia de `docs/evidence/` (capturas del tablero y acta de usabilidad) |
| [ ] | Etiqueta de versión capstone-v1.0 | Pendiente | `git tag` no devuelve ninguna etiqueta. Defecto DEF-031, abierto |
| [x] | Repositorio presentable sin archivos temporales | Completado | Verificado el 15 nov 2026: árbol de trabajo limpio, sin archivos sin seguimiento (tarjeta EVI-006) |

## 4.1 Estado del árbol de trabajo

| Dato | Valor |
| --- | --- |
| Rama activa | develop |
| Commits en total | 56 (en el commit verificado 6b15daa) |
| Commits del período 17 ago – 15 nov 2026 | 56 |
| Pull requests mergeados | 1 |
| Etiquetas de versión | 0 |
| Fecha de verificación | 15 de noviembre de 2026 |
| Archivos sin seguimiento | Ninguno — árbol de trabajo limpio |

El conteo de commits corresponde al commit verificado (6b15daa), no al HEAD del momento de leer este documento: el propio commit que publica el checklist añade commits al repositorio, de modo que fijar la cifra al HEAD la dejaría desactualizada de inmediato.

<!-- pagebreak -->

# 5. Entorno de producción operativo

Declaración de alcance. El proyecto no contempla despliegue en producción comercial. Según 1-ficha del proyecto (§6.2), 2-acta de constitucion (restricciones) y 14-documento arquitectura de software (§7), quedan fuera del alcance: despliegue en nube pública, configuración de nginx, certificados SSL, balanceadores de carga, réplicas de base de datos, CDN y alta disponibilidad. La infraestructura del proyecto es de costo cero y se ejecuta en el entorno local de desarrollo.

## 5.1 Lo que sí debe estar operativo

|  | Ítem | Estado | Evidencia |
| --- | --- | --- | --- |
| [x] | Base de datos MariaDB accesible y con el esquema aplicado | Verificado | 33 migraciones en estado «Ran»; `php artisan migrate:status` sin pendientes. MariaDB 12.3.2 |
| [x] | API Laravel escuchando y con la ruta de salud activa | Verificado | `http://127.0.0.1:8000/up` responde 200; `POST /api/login` responde 422 ante credenciales inválidas y 200 con token Bearer ante credenciales válidas |
| [x] | Frontend Next.js compilando y sirviendo | Verificado | `npx next build` sin errores; `http://localhost:3000` carga el login |
| [~] | Servidor de tiempo real Reverb operativo | Parcial | `php artisan reverb:start` escucha en `ws://localhost:8080` y el handshake responde 101 Switching Protocols. La suscripción al canal privado no se completa: `POST /broadcasting/auth` devuelve 403 (DEF-033) |
| [x] | Datos de demostración sembrados | Verificado | El contrato de `DemoDataSeeder` produce 300 usuarios, 8 departamentos, 32 publicaciones y 180 conversaciones. La base de desarrollo contiene además datos de prueba manuales: 301 usuarios, 9 departamentos, 33 publicaciones, 152 documentos, 181 conversaciones, 2932 mensajes, 3872 lecturas, 55 comentarios y 16 carpetas |
| [x] | Disco público sirviendo adjuntos sin depender del symlink | Verificado | `PublicStorageTest`; disco public con `serve => true` |
| [x] | Suite automatizada en verde en el entorno instalado | Verificado | `php artisan test` → 133 passed (468 assertions), 256,47 s |
| [x] | Configuración CORS operativa entre :3000 y :8000 | Verificado | Cabecera `Access-Control-Allow-Origin: *` en las respuestas de `api/*` |
| [x] | Zona horaria de base de datos forzada a UTC | Verificado | DB_TIMEZONE (DEF-007) |

## 5.2 Lo que no aplica a este proyecto

|  | Ítem | Motivo |
| --- | --- | --- |
| [—] | Servidor de producción con balanceador de carga | Fuera del alcance declarado en 1-ficha del proyecto §6.2 |
| [—] | Nginx o Apache como servidor frontal | Fuera de alcance; el despliegue usa el servidor de desarrollo de PHP |
| [—] | Certificado SSL y HTTPS | Fuera de alcance en el entorno local; aplica solo en producción (RNF-SEG-01) |
| [—] | MariaDB con réplicas de lectura y alta disponibilidad | Topología de producción documentada como referencia en 14-documento arquitectura §7, no implementada |
| [—] | CDN para assets estáticos | Fuera de alcance |
| [—] | Monitoreo, alertas y logs centralizados | Fuera de alcance; el logging es local (LOG_CHANNEL=stack) |
| [—] | Pipeline de CI/CD | Fuera de alcance; el flujo de trabajo es local con revisión por pull request |

## 5.3 Verificación del entorno instalado

| Dato | Valor |
| --- | --- |
| Fecha de verificación | 15 de noviembre de 2026 |
| Responsable | Benjamín Herrera (Backend) y Julián Tapia (Frontend) |
| Sistema operativo y versión | Microsoft Windows 11 Pro 10.0.26300, 64 bits |
| Versiones de PHP / Node / MariaDB / Composer / Reverb | PHP 8.4.27 (CLI) · Node 24.22.1 · MariaDB 12.3.2 · Composer 2.10.3 · Laravel Reverb 1.10 sobre Laravel 13 |
| Commit instalado | `6b15daa` — «add: documentos fase 2.2 y 3» (rama develop) |
| Resultado de php artisan test | 133 passed, 468 assertions, 0 failed, 256,47 s (SQLite en memoria, sin cobertura) |
| Resultado de npx tsc --noEmit | Código de salida 0, sin salida |
| Resultado de npx eslint . | Código de salida 0, sin errores |
| Resultado de npx next build | Código de salida 0 — «✓ Compiled successfully in 8.0s» |
| Verificación del tiempo real (WebSocket 101) | Verificado: «HTTP/1.1 101 Switching Protocols», cabecera «X-Powered-By: Laravel Reverb» y evento `pusher:connection_established` sobre `ws://127.0.0.1:8080` |
| Incidencias | 5 incidencias detectadas — ver tabla siguiente |

Incidencias detectadas en la verificación del 15 de noviembre de 2026

| # | Incidencia | Impacto | Tratamiento |
| --- | --- | --- | --- |
| 1 | `POST /broadcasting/auth` responde 403 a un token válido. La ruta se registra con middleware `web` y `config/auth.php` solo define el guard `web` (sesión), de modo que el guard `sanctum` no llega a invocarse | Impide la suscripción a cualquier canal privado | Defecto DEF-033. Corregir registrando el canal de broadcast con el guard `sanctum` |
| 2 | El frontend se suscribe al canal `conversations.{id}` mientras el backend emite y autoriza `conversation.{id}` | La entrega en vivo no se produce aunque se corrija la incidencia 1 | Defecto DEF-032. Unificar el nombre del canal en backend, frontend y README |
| 3 | PHP local 8.4.27; el README del proyecto declara PHP 8.5 y `composer.json` admite `^8.3` | La suite pasa igual, pero el entorno no cumple la versión documentada | Desviación de entorno, no bloqueante. Declarar el PHP efectivo en la entrega |
| 4 | `php artisan serve` no logra escuchar el puerto 8000 en este equipo («Failed to listen on 127.0.0.1:8000») | Solo afecta la verificación local | Verificado con `php -S 127.0.0.1:8000 -t public`, ejecutado desde `backend/public` |
| 5 | Las peticiones a la API sin la cabecera `Accept: application/json` responden 500 («Route [login] not defined») en lugar de 401 | No afecta al frontend, que sí envía la cabecera | Defecto de robustez de la API. Riesgo R9 en §7.1 |

<!-- pagebreak -->

# 6. Capacitación realizada

|  | Ítem | Estado | Observación |
| --- | --- | --- | --- |
| [—] | Capacitación a usuarios finales de la organización | No aplica | El proyecto es de título y de práctica: no hay usuarios de una organización real a los que capacitar. La validación con usuarios reales (§7) cumple la función equivalente |
| [ ] | Capacitación al equipo técnico (transferencia de conocimiento) | Pendiente | Se materializará con el 5-Manual de implementacion y el video de demostración (`intranet/docs/demo/demo.mp4`) |
| [~] | Material de capacitación para el equipo técnico | Parcial | Existe el video de demostración del sistema y el manual de implementación; falta una sesión registrada de traspaso |

## 6.1 Plan de traspaso propuesto

| Actividad | Formato | Duración estimada | Fecha |
| --- | --- | --- | --- |
| Recorrido funcional del sistema | Video de demostración (`docs/demo/demo.mp4`) + este manual | 30 min | Por definir |
| Puesta en marcha del entorno | Sesión práctica siguiendo el 5-Manual de implementacion | 60 min | Por definir |
| Revisión de la arquitectura | Lectura de 14-documento arquitectura de software + graph.html del knowledge graph | 45 min | Por definir |
| Revisión de las decisiones de diseño | Lectura de las 7 decisiones justificadas (DD-1 a DD-7) | 30 min | Por definir |

<!-- pagebreak -->

# 7. Validación y aceptación del cliente

|  | Ítem | Estado | Evidencia | Responsable |
| --- | --- | --- | --- | --- |
| [ ] | Acta de pruebas de usabilidad con usuarios reales (3 a 5 pilotos) | Pendiente | Hito M4. Los 300 usuarios sintéticos no sirven para medir | Benjamín Herrera y Julián Tapia |
| [ ] | Métrica NSM reportada (mensajes / WAU / semana; objetivo 5) | Pendiente | Se calcula desde la tabla de lecturas y de mensajes | Benjamín Herrera |
| [ ] | WAU (usuarios activos semanales) medido | Pendiente | Mismo origen de datos | Benjamín Herrera |
| [ ] | Tiempo hasta el primer mensaje de un ingreso nuevo | Pendiente | — | Julián Tapia |
| [ ] | Tareas críticas completadas sin asistencia (baseline vs. post) | Pendiente | RNF-UXA-07 | Julián Tapia |
| [ ] | Correcciones derivadas de la validación | Pendiente | — | Benjamín Herrera y Julián Tapia |
| [ ] | Informe ejecutivo de una página | Pendiente | Entregable del hito M4 | Benjamín Herrera |
| [ ] | Acta de validación y aceptación firmada | Pendiente | Cierre del proyecto | Docente guía + integrantes |
| [ ] | Confirmación de que los 10 módulos están operativos | Pendiente | Hoy hay 7 de 10 — ver §1.1 | Docente guía |

## 7.1 Riesgos abiertos para el cierre

| ID | Riesgo | Impacto | Mitigación vigente |
| --- | --- | --- | --- |
| R1 | Los documentos de M3 no se escriben a tiempo | Alto | Reducido: la Fase 2.2 cubre los 6 entregables de cierre y los cinco documentos de `docs/` ya están escritos; solo queda la evidencia de `docs/evidence/` (§3.1) |
| R2 | M4 depende de conseguir usuarios reales | Alto | Sin estrategia activa. Es el mayor riesgo de la entrega: la campaña con pilotos debe gestionarse en paralelo desde ya, no en la semana 14 |
| R3 | M2 deja los tres módulos para el final | Alto | Materializado: Tareas, Directorio y Novedades siguen sin implementar |
| R4 | La carga de trabajo queda desbalanceada entre los dos integrantes | Medio | Reparto actual: 15 defectos de backend y 15 de frontend |
| R5 | Inconsistencia entre la documentación y el código | Medio | Persisten: tokens `brand-*` frente a `--primary`, y la nomenclatura anterior a Coherev en el backlog, que no está versionado como Markdown |
| R6 | El proyecto crece y aparece trabajo no planificado | Medio | WIP máximo de 3 tarjetas por persona y backlog como fuente de verdad |
| R7 | El repositorio no tiene etiqueta de versión | Bajo | DEF-031 abierto; se cierra con la tarjeta EVI-006 |
| R8 | El realtime del chat no entrega mensajes: el frontend se suscribe a `conversations.{id}` mientras el backend emite y autoriza `conversation.{id}`, y la ruta `/broadcasting/auth` devuelve 403 porque resuelve el usuario con el guard `web` en vez de `sanctum` | Alto | Materializado: DEF-032 y DEF-033. Sin corrección, el Ciclo 1 (CP-015…CP-020) no puede pasar. La corrección es acotada: unificar el nombre del canal y registrar el canal de broadcast con el guard `sanctum` |
| R9 | Las peticiones a la API sin `Accept: application/json` devuelven 500 en lugar de 401 | Bajo | El frontend siempre envía la cabecera, de modo que el impacto es acotado a clientes externos. Se corrige con una ruta `login` nombrada o forzando la respuesta JSON en el middleware de autenticación |

<!-- pagebreak -->

# 8. Cierre administrativo del proyecto

|  | Ítem | Estado | Observación |
| --- | --- | --- | --- |
| [ ] | Acta de pruebas firmada | Pendiente | Se firma al cerrar el Ciclo 3 (11 dic 2026) |
| [ ] | Registro de defectos cerrado (0 defectos Críticos/Altos abiertos) | Pendiente | Hoy: 30 de 31 cerrados en el registro vigente; el abierto es DEF-031, de severidad Baja. Se incorporan además DEF-032 y DEF-033, detectados en la verificación técnica del 15 nov 2026 |
| [ ] | Checklist de término completado y firmado | Pendiente | v1.2 emitida el 15 nov 2026; la firma se produce al cierre del proyecto (20 dic 2026) |
| [ ] | Entrega de los manuales al cliente | Pendiente | Los 6 manuales de la Fase 2.2 están emitidos; falta la entrega formal |
| [ ] | Repositorio etiquetado con la versión entregada | Pendiente | `git tag capstone-v1.0` (tarjeta EVI-006, DEF-031) |
| [x] | Repositorio limpio, sin archivos sin seguimiento ni temporales | Completado | Verificado el 15 nov 2026: `git status` sin salida |
| [ ] | PPT del capstone actualizada con el stack real | Pendiente | Debe reflejar MariaDB (no MySQL) y documentar Laravel Reverb (tarjeta EVI-004) |
| [ ] | Defensa ensayada con guion cronometrado (20 minutos) | Pendiente | Hito M6 |
| [ ] | Evidencia ordenada y archivada (`docs/evidence/`) | Pendiente | Capturas del tablero Trello (EVI-001) y acta de usabilidad (EVI-002) |
| [ ] | Backlog actualizado con el estado final de las 35 tarjetas | Pendiente | La distribución actual del .xlsx está desactualizada respecto del código |
| [ ] | Cierre de los 6 módulos de la Fase 2.2 en el tablero | Pendiente | — |
| [ ] | Evaluación final de la Fase 2 por la docente guía | Pendiente | — |

<!-- pagebreak -->

# 9. Resumen de bloqueos para el cierre

Ordenados por criticidad. Los tres primeros son condición necesaria para que el proyecto pueda cerrarse honestamente.

| # | Bloqueo | Tipo | Acción requerida | Responsable |
| --- | --- | --- | --- | --- |
| 1 | 3 de 10 módulos funcionales sin implementar (Tareas, Directorio, Novedades) | Alcance | Implementar los módulos, o declarar formalmente su exclusión del alcance con el aval de la docente guía | Benjamín Herrera y Julián Tapia |
| 2 | El realtime del chat no entrega mensajes (DEF-032, DEF-033) | Funcionalidad | Unificar el nombre del canal en backend, frontend y README, y registrar el canal de broadcast con el guard `sanctum`. Debe resolverse antes del Ciclo 1 | Benjamín Herrera y Julián Tapia |
| 3 | 34 casos de prueba sin ejecutar | Verificación | Ejecutar la campaña del 1-Plan de pruebas entre el 16 nov y el 20 dic | Benjamín Herrera y Julián Tapia |
| 4 | Validación con usuarios reales sin gestionar | Evidencia | Conseguir 3 a 5 pilotos antes de la semana 14 y ejecutar la campaña | Benjamín Herrera y Julián Tapia |
| 5 | Sin etiqueta de versión (DEF-031) | Entrega | `git tag capstone-v1.0` tras integrar la versión final | Benjamín Herrera |
| 6 | La evidencia de `docs/evidence/` sigue ausente (capturas del tablero y acta de usabilidad) | Documentación | Exportar el tablero real (EVI-001) y formalizar el acta de la sesión con usuarios reales (EVI-002) | Benjamín Herrera y Julián Tapia |
| 7 | Accesibilidad WCAG AA sin auditoría con axe-core | Calidad | Declarar axe-core y ejecutar la auditoría (caso CP-033) | Julián Tapia |
| 8 | Errores de formulario por campo pendientes (UX-003) | Calidad | Implementar el mapa de errores del servidor a cada input (caso CP-034) | Julián Tapia |
| 9 | Nomenclatura anterior a Coherev en el backlog | Documentación | Unificar a Coherev (tarjeta EVI-005) | Benjamín Herrera y Julián Tapia |
| 10 | PPT con el stack desactualizado | Entrega | Corregir a MariaDB y documentar Reverb (tarjeta EVI-004) | Benjamín Herrera |

> El ítem «Dos archivos sin seguimiento en el árbol de trabajo» se retiró de esta lista: fue verificado y cerrado el 15 de noviembre de 2026, con el árbol de trabajo limpio (ver §4.1).

<!-- pagebreak -->

# 10. Firmas

| Rol | Nombre | Fecha | Firma |
| --- | --- | --- | --- |
| Desarrollador Backend | Benjamín Herrera |  |  |
| Desarrollador Frontend | Julián Tapia |  |  |
| Docente guía / Sponsor | Cindy Betzabé Contador Cisterna |  |  |

Checklist de término v1.2 emitido el 15 de noviembre de 2026 sobre el estado real del repositorio intranet (rama develop, commit verificado 6b15daa, 56 commits, 133 pruebas automatizadas con 468 aserciones en verde) y de los documentos de las Fases 1, 2 y 2.1. La v1.0 se emitió el 13 de noviembre de 2026 y la v1.1 el mismo 15 de noviembre tras completar la verificación técnica del entorno (§5.3), corregir las cifras del repositorio y de la suite, y degradar RF-CHT-06 y RF-CHT-07 a estado parcial por los defectos DEF-032 y DEF-033. La v1.2 adopta la tipografía Calibri del resto de la documentación del proyecto y da por escritos los cinco documentos de `docs/` prometidos en §3.1.
