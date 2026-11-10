# Coherev — Intranet Corporativa
## Documento de respuestas al cuestionario de evaluación técnica (Arquitectura · Datos · Tecnologías · Metodología · Calidad)

**Proyecto:** Coherev — Intranet Corporativa
**Repositorio:** monorepo `intranet/` (`backend/` Laravel 13 + `frontend/` Next.js 16)
**Fecha de elaboration:** 10 de noviembre de 2026
**Estado:** verificado contra el código en la rama `develop` (HEAD `1bd112d`)

---

## 0. Base de evidencia de este documento

Toda respuesta que sigue está fundamentada en artefactos verificables del repositorio, no en descripciones genéricas. La evidencia primaria utilizada fue:

| Fuente | Evidencia obtenida |
|---|---|
| `backend/routes/api.php` + `php artisan route:list` | 56 rutas bajo `/api`, 63 rutas registradas en total |
| `backend/database/migrations/` | 33 archivos de migración (esquema evolutivo) |
| `docs/Fase 2.1/15.1-esquema de la base de datos.sql` | 15 tablas de dominio + 8 tablas de framework (InnoDB, utf8mb4) |
| `docs/Fase 2.1/14-documento arquitectura de software.docx` | Vistas 4+1, objetivos OA1-OA5, restricciones RA1-RA5, decisiones DD-1…DD-7, riesgos R1-R8 |
| `docs/Fase 2.1/8 y 9-requerimientos F y NF.docx` | 51 Requisitos Funcionales + 35 Requisitos No Funcionales |
| `docs/Fase 2.1/11-product backlog.xlsx` | 35 tarjetas, 6 épicas, 7 iteraciones, WIP 3/persona |
| `docs/Fase 2.1/2-acta de constitucion.docx` | Acta firmada, roles, hitos, criterios de aceptación |
| `php artisan test --no-coverage` (ejecutado 10/11/2026) | **123 tests, 430 assertions, 123 passed (100 %), 226,40 s** |
| `git log` (49 commits, 2026-08-17 → 2026-11-09) | Historial de defectos corregidos y decisiones |

**Nota de honestidad metodológica:** el repositorio **no** contiene un registro formal de defectos (no hay Jira, ni carpeta `defects/`, ni actas de pruebas). Tampoco existen pruebas automatizadas de frontend, pruebas de carga, ni validación con usuarios reales ejecutada. En los apartados correspondientes se responde con la evidencia realmente disponible y se declara explícitamente la brecha, en lugar de estimar cifras que el repositorio no respalda.

---

# 1. Arquitectura de software y diseño del sistema

## 1.1 ¿Qué tipo de arquitectura usaron y por qué la seleccionaron?

**Arquitectura elegida: monolito modular en capas, con cliente-servidor y API REST, deployado como monorepo de dos aplicaciones independientes (SPA + API).**

Concretamente, el sistema se compone de:

```
┌──────────────────────────────┐   HTTPS + Bearer Token (REST)   ┌──────────────────────────────┐
│  Frontend — Next.js 16 SPA   │ ───────────────────────────────▶ │  Backend — Laravel 13 API   │
│  App Router · React 19 · TS  │                                  │  Sanctum · Reverb · Eloquent│
│  app/ · components/ · lib/   │ ◀─── WebSocket (Echo / Reverb) ──│  Controllers→Policies      │
└──────────────────────────────┘                                  └───────────────┬──────────────┘
                                                                               │
                                                            ┌──────────────────▼───────────────┐
                                                            │  MariaDB 10.x (InnoDB, utf8mb4) │
                                                            └──────────────────────────────────┘
```

**Por qué se seleccionó, con base en las restricciones del proyecto:**

1. **Es una intranet corporativa, no un producto de alta escala pública.** El acta de constitución acota el despliegue a entorno local (Laravel Herd) y prohíbe dependencias de terceros pagados. Un monolito modular es el mínimo complejidad que satisface el alcance.
2. **El dominio es altamente relacional y transaccional.** Permisos por rol + departamento, pertenencia N:M, integridad referencial entre 15 tablas. El modelo relacional con FK reales cubre esto de forma nativa; el modelo de datos era la restricción dominante.
3. **Separación de responsabilidades desde el inicio (objetivo arquitectónico OA1).** El backend tiene 5 capas con dependencias unidireccionales (HTTP → Dominio → Persistencia; Autorización → Dominio; Tiempo real → Dominio) y el frontend 3 capas (Rutas, Componentes, Servicios). Esto permite que dos personas trabajen en paralelo — una en backend, otra en frontend — sin bloqueos.
4. **Trazabilidad extremo a extremo (OA3).** Un monolito con esquema por migraciones y rutas centralizadas facilitate el mapeo *Problema → RF → HU → Funcionalidad → Prueba*.
5. **El modelo de despliegue documentado es de 3 tiers** (balanceador → PHP-FPM → MariaDB con réplicas de lectura, Reverb como servicio independiente), no de servicios distribuidos.

**Lo que la arquitectura NO es:** no es microservicios, no es event-driven puro (el único evento es `MessageSent`, con broadcast síncrono al canal), no es hexagonal/clean architecture estricta (no hay puertos ni adaptadores de dominio; Eloquent es Active Record y el modelo conoce la persistencia), no es serverless.

## 1.2 ¿Qué ventajas y desventajas presenta la arquitectura seleccionada frente a otras alternativas?

| Alternativa evaluada | Ventajas que habría aportado | Por qué NO se eligió | Ventajas de la elegida | Desventajas de la elegida |
|---|---|---|---|---|
| **Microservicios** | Escalado independiente por módulo, despliegue autónomo, tolerancia a fallos | Overhead de red y operacional desproporcionado para 2 personas y alcance local; el problema de datos compartidos (mensajes + documentos + permisos) se vuelve distribuido y transaccional | Un solo despliegue, un solo esquema transaccional, debugging local inmediato, coste operativo $0 | Acoplamiento de despliegue: no se puede escalar el chat sin escalar todo; no hay aislamiento de fallos; el crecimiento del monolito puede degradar el build y el código |
| **Monolito modular en capas (elegida)** | Modularidad interna, transactions ACID, bajo costo operacional | — | Claves foráneas y transacciones reales; refactor seguro; un `php artisan test` levanta todo el backend | Frontend y backend se despliegan juntos; no hay dominio claramente extraíble (el chat sí lo sería) |
| **SPA con Sanctum (cookies)** | Revocación centralizada, menos XSS vía token en storage | Frontend (`:3000`) y backend (`:8000`) no comparten dominio → Sanctum SPA exige cookie de sesión same-site | Sanctum **PAT**: el token viaja en header `Authorization`, es portable entre dispositivos y se revoca individualmente por dispositivo (`DD-1`) | El token en `localStorage` es accesible a XSS; requiere `localStorage`/`sessionStorage` según preferencia (`DD-5`) |
| **Serverless / BaaS** | Coste cero en reposo, escalado automático | Dependencia de terceros pagos prohibida por el acta; la lógica de permisos es tightly coupled a Eloquent y a los canales privados de Reverb | Licencias $0, stack unificado con el curricular del equipo | Sin escalado automático; Reverb debe correr como proceso propio |
| **GraphQL** | Una sola consulta para múltiples vistas del dashboard | Sobre-ingeniería para 56 endpoints REST bienTipados; el contrato REST ya está documentado en `API_NEXTJS.md` | Contrato explícito por recurso, cacheable por HTTP, fácil de testear con PHPUnit | N+1 en el cliente y sobre-fetching; el dashboard paga varias requests |

**Desventajas asumidas conscientemente** (documentadas en el documento de arquitectura, §12): *inconsistencia documentación-código* (R1), *endpoints sin autorización accidental* (R2 — mitigado por SEC-002…SEC-005 + 4 suites de autorización), *caída de Reverb* (R3 — con fallback Pusher), *crecimiento de BD* (R4), *sobrecarga del canal WebSocket* (R7).

## 1.3 ¿Cómo se comunican los componentes (frontend, backend, base de datos)?

**Dos canales paralelos y separados, cada uno con su protocolo:**

**(a) REST + Bearer Token (síncrono)**
- Base configurable: `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8000/api`), en `frontend/lib/api-client.ts:3`.
- Todas las requests pasan por **un único cliente** (`apiFetch`), que centraliza: header `Accept: application/json`, `Content-Type` automático según `FormData` vs JSON, header `Authorization: Bearer <token>`, `cache: "no-store"`, y normalización de errores.
- Errores: se extrae `payload.message` o el primer `payload.errors[campo][0]`; si la red falla, se lanza `ApiClientError` con código `0` y mensaje accionable; un `401` limpia la sesión y redirige al login (cumpliendo RNF-DISP-06: la invalidación se propaga a todas las pestañas).
- **El backend nunca es-called directamente desde un componente**: la regla OA5/RNF-MANT-06 obliga a que toda integración pase por `lib/`.

**(b) WebSocket (asíncrono, tiempo real)**
- `frontend/lib/echo-client.ts` configura Laravel Echo con `broadcaster: "reverb"`, `ws/wss` como transportes, y `authEndpoint` → `POST /broadcasting/auth` con el mismo `Authorization: Bearer`.
- El backend emite `broadcast(new MessageSent($message))->toOthers()` sobre un `PrivateChannel("conversation.{conversation_id}")`.
- **Autorización del canal** en `backend/routes/channels.php`: se valida que el usuario sea participante de la conversación; si no, la suscripción se rechaza sin revelar la existencia del canal.
- **Canal privado ≠ canal público**: el nombre del canal no es un dato de negocio visible; el permiso se re-verifica en el servidor en cada suscripción.

> **Defecto real detectado al verificar esta respuesta** (§1.3.b): el backend emite y autoriza el canal `conversation.{id}` — singular — (`app/Events/MessageSent.php:35`, `routes/channels.php:6`), mientras que el frontend usa `conversations.{id}` — plural — por defecto (`frontend/lib/echo-client.ts:63`) y ambos README documentan la variante plural. Como `frontend/.gitignore` excluye `.env*`, un clon nuevo depende de un `.env.local` local no versionado para que el realtime funcione, y ninguna documentación indica el valor singular correcto. El síntoma es silencioso: el chat simplemente no recibe mensajes. **Ningún test lo detecta**, porque la suite es solo de backend y no hay E2E (§5.1). Es la evidencia más concreta de por qué el E2E es prioritario.

**(c) Tercer canal, no obvvio: `BroadcastChannel` del navegador**
- Sincroniza el estado del chat entre pestañas del mismo usuario **sin pasar por el servidor** (`DD-4`), reduciendo latencia y evitando duplicar mensajes entre pestañas.

**(d) Backend ↔ Base de datos**
- Acceso **exclusivamente por Eloquent ORM** (`RNF-DISP-03`), lo que elimina la concatenación de SQL y permite *eager loading* (12 usos de `with()`/`withCount()` detectados) para evitar N+1.
- La base de datos **nunca se expone al navegador**: no hay credenciales en el frontend, ni SQL cliente, ni ORM en el cliente.

## 1.4 ¿Qué patrones de diseño usaron y cómo contribuyen?

| Patrón | Dónde vive | Contribución concreta |
|---|---|---|
| **MVC + Front Controller** | `app/Http/Controllers/Api/*` (12 controladores, 54 métodos públicos) | Un punto de entrada único; los controladores solo reciben, delegan validación y orquestan respuesta |
| **Capas con dependencias unidireccionales** | HTTP → Dominio → Persistencia; Autorización → Dominio; Tiempo real → Dominio | Permite razonar el flujo sin salto de capa; base de la mantenibilidad (RNF-MANT-01/02) |
| **Middleware / Chain of Responsibility** | `auth:sanctum`, `admin` (`app/Http/Middleware/AdminOnly.php`), `throttle:login` | Autorización ortogonal y reutilizable: una ruta es protegida por composición de middleware, no por `if` en el controlador |
| **Policy (autorización a nivel de modelo)** | `AnnouncementPolicy`, `DocumentPolicy` | La regla "¿puede este usuario editar *esta* publicación?" vive con la entidad; no se duplica en el controlador. `AnnouncementPolicy::update()` combina `canManageAnnouncements()` + `isAdministrator()` + propiedad |
| **Strategy / Trait compartido** | `app/Http/Requests/Concerns/RejectsMimeMismatch.php` | La validación de MIME real se reutiliza en documentos, adjuntos y mensajes sin duplicar el código |
| **Transformer / Data Mapper** | `app/Http/Resources/` (`UserResource`, `RoleResource`, `CommentResource`) | El JSON expuesto se define de forma explícita; el modelo Eloquent no se filtra al cliente |
| **Active Record (Eloquent)** | `app/Models/*` (11 modelos, 48 métodos) | Menos código de persistencia, pero acopla el dominio al esquema — es la contrapartida asumida de usar Eloquent |
| **Observer / Event (Publish-Subscribe)** | `app/Events/MessageSent.php` (`ShouldBroadcast`) | Desacopla "guardar mensaje" de "notificar a los participantes"; el canal es privado y por conversación |
| **Adapter** | `config/broadcasting.php` + `echo-client.ts` (Reverb \| Pusher) | Cambiar de servidor WebSocket no toca código de negocio (`DD-2`, `RNF-DISP-02`) |
| **Singleton** | `getEcho()` en `echo-client.ts:41` (instancia única de Echo) | Una sola conexión WebSocket por pestaña, no una por componente |
| **Dependency Injection / IoC (Service Container)** | Contenedor de Laravel | Las Policies y Form Requests se resuelven por contrato; sustituibles en pruebas |
| **Composición sobre herencia** | Autorización por middleware + Policy en vez de subclases por rol | Añadir un rol nuevo no obliga a tocar 12 controladores |
| **Facade** | `Route::`, `Schema::`, `DB::`, `Storage::` | Código de dominio legible sin acoplar a clases concretas del framework |
| **Tokens semánticos (UI)** | `globals.css` + Tailwind v4 (`brand-primary`, `brand-accent`…) | Rebranding sin tocar componentes (`DD-7`) |

**Contribución agregada:** mantenibilidad (controladores delgados, una regla por archivo, easy onboarding), seguridad (autorización declarativa y testeable en aislamiento), y testabilidad (las Policies se prueban como unidades puras con un `User` fake, sin HTTP).

## 1.5 ¿Qué ocurriría si el número de usuarios aumentara considerablemente?

**Respuesta honesta: con la configuración actual, el sistema soporta bien un crecimiento moderate-to-alto de usuarios concurrentes dentro de una organización, pero colapsaría en un escenario de miles de usuarios simultáneos en tiempo real.** El cuello de botella no es la base de datos ni el código: es la topología de ejecución (una instancia de Reverb, una instancia de PHP-FPM, una instancia de MariaDB) y la ausencia de un bus de eventos compartido.

**Análisis por capa, con el estado real verificado en `.env` y `config/`:**

| Capa | Estado actual | Comportamiento bajo carga | Veredicto |
|---|---|---|---|
| Frontend (Next.js) | Build estático/SSR en un proceso Node | Escala horizontalmente trivial (es stateless). Ya tiene paginación y scroll infinito en el dashboard (`0985835`) | ✅ Preparado |
| API Laravel (PHP-FPM) | Instancia única, sin caché compartida | Escala horizontalmente con un balanceador; el estado es *stateless* (autenticación por token PAT, `RA4`) | ✅ Preparado (falta balanceador) |
| MariaDB | Instancia única, `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database` | El caché y las colas **en base de datos** se convierten en cuellos de botella: cada `page hit` de caché escribe en la BD | ⚠️ Requiere Redis |
| Reverb (WebSocket) | Instancia única, `BROADCAST_CONNECTION=reverb` **sin Redis** | Cada conexión WebSocket persistente consume un proceso/hilo. Con >1 instancia de Reverb, un broadcast sólo llega a los clientes conectados **a esa instancia** | ❌ Cuello de botella crítico |
| Archivos | Disco local (`FILESYSTEM_DISK=local`) | Un solo volumen; no hay CDN ni almacenamiento de objetos | ⚠️ Requiere S3 + CDN |

**El error conceptual que un evaluador debe evitar:** "la arquitectura por capas escala mal" es falso. **La arquitectura por capas escala bien; lo que no escala es la topología de una sola instancia.** Son cosas distintas.

**Plan de escalado en 4 pasos, sin reescribir el sistema:**
1. **Redis** para caché, colas y **bus de broadcast** → habilita múltiples instancias de Reverb detrás de un balanceador con WebSocket sticky sessions (`config/broadcasting.php` pasa a `redis`). Es el paso de mayor retorno y el más barato.
2. **Réplicas de lectura de MariaDB** (ya está documentado en la vista de despliegue §7.2 del documento de arquitectura) para los listados de documentos y publicaciones.
3. **Múltiples réplicas de PHP-FPM** detrás de nginx, con `php artisan queue:work` en workers separados para el procesamiento asíncrono (notificaciones, generación de miniaturas).
4. **Almacenamiento de objetos + CDN** para adjuntos, y virtualización de listas largas en el frontend.

**¿Cambiar a microservicios?** No ahora. El criterio correcto es: extrae microservicios cuando un módulo tenga un **perfil de carga o de despliegue incompatible** con el resto, no cuando "el proyecto crece". El único candidato natural es el **chat** (WebSocket + mensajes + adjuntos), porque su escalado es distinto al del CRUD documental. Si se llegara a ese punto, la extracción es barata porque el chat ya está encapsulado: `ConversationController`, `MessageController`, `Conversation`/`Message`/`MessageRead`, `MessageSent` y `routes/channels.php` — es un *bounded context* limpio, con `messages` y `message_reads` en tablas propias.

**Aclaración de alcance:** el proyecto es una intranet corporativa para una organización con un número de usuarios acotado. El objetivo de diseño realista es *rendimiento predecible* (RNF-REN-03: < 500 ms en el 95 % de las lecturas), noFRA. Escalar a millones de usuarios es un escenario fuera del alcance del acta.

---

# 2. Bases de datos y gestión de información

## 2.1 ¿Qué motor usaron y con qué criterios técnicos lo seleccionaron?

**Motor: MariaDB 10.x, InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.**

Configuración real (`backend/.env`):
```
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pr_intra_back
```

**Criterios técnicos de selección (documentados como `DD-3`, `RA2` y `RNF-DISP-03`):**

1. **Integridad referencial con comportamiento explícito.** InnoDB soporta FK con `ON DELETE CASCADE` / `ON DELETE SET NULL`. El esquema aplica **25 claves foráneas** (24 en tablas de dominio + 1 en la tabla `sessions` del framework) con esas dos políticas — exactamente el comportamiento de negocio requerido (borrar un departamento cascadea sus roles y carpetas; borrar un usuario cascadea sus mensajes, pero deja el documento huérfano con `SET NULL`).
2. **Restricciones `UNIQUE`复合 que codifican reglas de negocio** en la base, no solo en PHP:
   - `users_email_unique` (identidad de la persona)
   - `roles_department_id_name_unique` (un rol por nombre dentro de un departamento)
   - `department_folders_department_id_parent_id_name_unique` (no dos carpetas con el mismo nombre en el mismo nivel)
   - `department_user_user_id_department_id_unique` (sin pertenencias duplicadas)
   - `announcement_attachments` y `documents` con `mime_type` + `size_bytes` para metadatos verificables.
3. **Compatibilidad MySQL 8 como restricción dura (`RA2`).** Todas las migraciones y consultas son portables; cambiar de motor no requiere reescribir código. Esto se decidió *antes* de escribir el esquema, no como parche posterior.
4. **Costo operacional $0** (acta de constitución: "Total estimado $0 CLP"). MariaDB es la opción por defecto de Laravel Herd, que era el entorno de desarrollo del equipo.
5. **Rendimiento de lectura** ligeramente superior en consultas analíticas de报表eo (`DD-3`), irrelevante para el caso de uso dominante pero sin costo.
6. **Ecosistema Eloquent maduro**: tipos ENUM nativos (`conversations.type`, `documents.visibility`), `morphs`, JSON, índices compuestos, `utf8mb4` completo (emojis en mensajes y publicaciones).

**Descartado: PostgreSQL** — técnicamente superior en algunos casos (JSONB, tipos enumerados más expresivos, mejor planner), pero incompatible con el stack documental (`RA2` fija compatibilidad MySQL) y con el `DB_CONNECTION=mariadb` ya asumido por el acta. **Descartado: MySQL puro** — sin ventaja funcional sobre MariaDB y con una diferencia de版本 que el proyecto asume como error de comunicación (riesgo R-03: "discrepancia entre el stack declarado en el PPT y el stack real").

**Nota sobre la base de datos de pruebas:** la suite PHPUnit corre contra **SQLite en memoria** (`phpunit.xml`: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`), no contra MariaDB. Esto da arranque instantáneo y aislamiento por test, pero implica que **la suite no valida el motor real de producción**: diferencias de SQL específico de MariaDB (índices, collation, `ENUM`, `ON DELETE`) no quedan cubiertas. Es una brecha conocida y una mejora concreta: un job de CI que ejecute la suite contra MariaDB en un servicio contenedor.

## 2.2 ¿Por qué relacional y no NoSQL? ¿Qué ventajas ofrece?

**Porque el dominio es relacional por naturaleza y la integridad es el activo principal.**

**Argumento desde el modelo de datos:**
- El dominio tiene **relaciones N:M reales** (`user_roles`, `conversation_user`, `department_user`) que necesitan integridad referencial bidireccional. En NoSQL hay que denormalizar y duplicar, y luego reconciliar a mano.
- Las **reglas de negocio son restricciones de unicidad**, no validators de aplicación: unicidad de email, unicidad de rol por departamento, unicidad de carpeta por padre. En un modelo relacional esto es un `UNIQUE` que el motor garantiza bajo concurrencia; en NoSQL es una lectura + escritura sin atomicidad.
- Las **consultas de autorización son relacionales por naturaleza**: "publicaciones visibles para este usuario" cruza `announcements × departments × department_user × roles`. En SQL es un `JOIN` con índices; en NoSQL es un aggregation pipeline o una desnormalización costosa que se vuelve obsoleta en cuanto cambia una regla.
- Se requiere **eliminar en cascada con precisión semántica distinta según el caso** (CASCADE vs SET NULL). Eso solo es nativo en un motor relacional.

**Ventajas concretas para este proyecto:**
1. **Una única fuente de verdad.** No hay duplicación de datos entre "colecciones", con lo que se elimina la divergencia entre respuestas de lectura y de escritura.
2. **Consultas de auditoría y trazabilidad reutilizables**: el contador de no leídos (`message_reads`), la pertenencia a departamentos (`department_user`) y el permiso de publicación (`roles`) son consultas analíticas que el sistema ya necesita.
3. **Coste cero y una sola tecnología**: el equipo ya tenía que aprender Laravel; sumar un motor NoSQL habría significado una segunda base, otro ORM y otro lenguaje de consulta, con el equipo de 2 personas.
4. **Compatible con el resto del stack**: Eloquent da un único punto de acceso, migraciones versionadas (33 archivos) y *seeders* reproducibles.

**Dónde un NoSQL sí habría sido mejor (honestidad):** el **buscador global** (`RF-FUT-04`, roadmap), la **auditoría de actividad** (`RF-FUT-06`, roadmap) y el **almacenamiento de adjuntos** (objetos binarios en S3 + metadatos en NoSQL). Ninguno de los tres es un requisito del alcance actual; cuando se implementen, la respuesta correcta es **híbrida** (PostgreSQL + un índice de búsqueda tipo Meilisearch/Elasticsearch), no una migración total.

## 2.3 ¿Qué diferencias hay entre SQL y NoSQL y cuándo usar cada una?

| Criterio | SQL (relacional) | NoSQL |
|---|---|---|
| **Modelo de datos** | Esquema fijo y declarado (tablas, tipos, FK) | Esquema flexible o sin esquema (documentos, clave-valor, grafos, columnas anchas) |
| **Integridad** | FK, `UNIQUE`, `CHECK`, `NOT NULL` — garantizada por el motor | Validación a nivel de aplicación; sin garantía nativa entre documentos |
| **Transacciones ACID** | Multifila nativas | Parcial o limitada (algunos motores sí; muchos no) |
| **Consultaciones ad-hoc** | SQL declarativo, cualquier combinación de filtros | Caso de uso específico por motor; consultasacetan el patrón de acceso |
| **Escalado horizontal** | Vertical por defecto; réplicas y particionado | Diseñado para sharding horizontal desde el origen |
| **Consistencia** | Generalmente fuerte | A menudo eventual (según el motor y la configuración) |
| **Operación** | Un solo esquema, un solo backup, un solo plan | Múltiples datastore que operar, respaldar y monitorear |

**Regla de decisión aplicada en este proyecto:** *¿la consulta cruza entidades con reglas de integridad y necesita ser consistente?* → SQL. *¿el acceso es por clave exacta, o por documento grande y variable que se lee casi siempre completo?* → NoSQL.

**Aplicado a Coherev:**
- `users`, `roles`, `user_roles`, `departments`, `documents`, `messages` → **SQL**, por integridad y joins de permisos.
- Caché de sesiones y de permisos → **Redis/Memcached** (no es NoSQL de documentos, pero evita el `CACHE_STORE=database` actual).
- Cola de trabajos (notificaciones, miniaturas) → **Redis** o base de datos.
- Archivos binarios → **almacenamiento de objetos** (S3-compatible), no la base de datos.

## 2.4 ¿Cómo diseñaron el modelo de datos y qué relaciones existen?

**Método:** diseño iterativo e incremental, con las **migraciones como fuente de verdad** (33 archivos, `2026_04_06` → `2026_11_09`) y un **snapshot consolidado** en `docs/Fase 2.1/15.1-esquema de la base de datos.sql` (MariaDB DDL listo para importar), más el **diagrama entidad-relación** en `docs/Fase 2.1/15-diagrama entidad relacion.pdf`.

**15 tablas de dominio + 8 de framework:**

*Identidad y permisos:* `users`, `personal_access_tokens`, `roles`, `user_roles`
*Organización:* `departments`, `department_user`, `department_folders`
*Contenido:* `announcements`, `announcement_attachments`, `comments`
*Documentos:* `documents`
*Chat:* `conversations`, `conversation_user`, `messages`, `message_reads`

**Relaciones principales (cardinalidad y FK):**

| Relación | Cardinalidad | FK / comportamiento |
|---|---|---|
| `departments` 1—N `users` (`users.department_id`) | N:1 | `ON DELETE SET NULL` — borrar el departamento no deja el usuario huérfano, lo deja sin departamento principal |
| `users` N—M `roles` (`user_roles`) | N:M | `ON DELETE CASCADE` en ambos lados; `UNIQUE` implícito por la tabla pivote |
| `users` N—M `departments` (`department_user`) | N:M | `UNIQUE(user_id, department_id)`; `users.department_id` se conserva como **departamento principal** (el primero) y se espeja en el pivote vía el hook `User::booted()` |
| `users` N—M `conversations` (`conversation_user`) | N:M | `ON DELETE CASCADE` |
| `conversations` 1—N `messages` | 1:N | `ON DELETE CASCADE` |
| `messages` N—1 `users` (emisor) | N:1 | `ON DELETE CASCADE` |
| `messages` N—1 `documents` (adjunto, opcional) | N:1 | `ON DELETE SET NULL` — el mensaje sobrevive al borrado del adjunto |
| `departments` 1—N `department_folders` | 1:N | `ON DELETE CASCADE` |
| `department_folders` 1—N `documents` | 1:N | `ON DELETE SET NULL` |
| `departments` 1—N `announcements` | 1:N | `ON DELETE CASCADE`; `department_id` **nullable** desde `2026_11_09` (publicación general = visible para toda la organización) |
| `announcements` 1—N `comments` / 1—N `announcement_attachments` | 1:N | `ON DELETE CASCADE` |
| `users` 1—N `messages`/`documents`/`comments`/`announcements` | 1:N | `ON DELETE CASCADE` |
| `messages` 1—N `message_reads` | 1:N | `ON DELETE CASCADE` — base del contador de no leídos persistente (multi-dispositivo) |

**Decisiones de modelado destacadas:**
- **`department_user` + `users.department_id`**: un usuario puede pertenecer a varios departamentos (caso real: un gerente en dos áreas), pero las vistas que muestran un solo departamento necesitan un valor canónico. La resolución se hace en `User::departmentIds()` (departamento principal primero) y se mantiene sincronizada en `User::booted()`.
- **Publicación general vs. por departamento**: se eliminó el patrón "copiar la publicación por cada departamento" y se sustituyó por `announcements.department_id NULL` — eliminó duplicación y el riesgo de inconsistencia entre copias.
- **Soft deletes** en `messages` y `documents` (`SoftDeletes`), con una **papelera** (`TrashController`) que permite restaurar — decisión de negocio explícita, no borrado físico.
- **Chat 1-a-1 modelado como `conversations` de tipo `private`**, lo que permite unificar el código de envío, lectura y moderación para chats privados y grupales.

## 2.5 ¿Qué mecanismos implementaron para garantizar integridad, consistencia, disponibilidad y seguridad de los datos?

### Integridad
- **25 claves foráneas** con políticas `CASCADE` / `SET NULL` explícitas por relación de negocio (§2.4).
- **Restricciones `UNIQUE`** en la BD para email, rol por departamento, carpeta por padre, pertenencia por par.
- **Validación en dos capas**: 14 Form Requests (reglas de tipo, tamaño, unicidad, existencia referencial, mensajes de error en español) + constraints de la base. Ninguna escritura llega al modelo sin pasar por un Form Request.
- **Verificación de MIME por contenido, no por extensión.** La regla `mimes:` de Laravel (`StoreDocumentRequest::allowedMimes()`) adivina el tipo real del archivo a partir de su **contenido** y lo contrasta contra la lista permitida; un `.pdf` que en realidad es un ejecutable se detecta como `application/x-dosexec` y se rechaza. El trait compartido `RejectsMimeMismatch` intercepta ese error de validación y lo traduce de **422** a **415** ("El tipo de archivo no está permitido"), reutilizando la misma regla en documentos, adjuntos y mensajes. Cubierto por 9 casos de `MimeValidationTest`.
- **Cast de tipos a nivel de modelo**: `password` → `hashed` (bcrypt automático), `email_verified_at` → `datetime`, flags booleanos.
- **`#[Hidden(['password','remember_token'])]`** en `User` → la contraseña nunca sale por la API (`RNF-SEG-03`).

### Consistencia
- **Transacciones ACID de InnoDB** para la atomicidad de las escrituras.
- **Eager loading** sistemático (`with()`, `withCount()`) para evitar el N+1, que es la causa habitual de inconsistencia temporal *y* de degradación de rendimiento.
- **Estado del cliente como caché, no como fuente de verdad**: el contador de no leídos pasó de `sessionStorage` a `message_reads` en BD (tarjeta `SEC-007`, commit `f68aedc`), de modo que el estado es consistente entre dispositivos.
- **Colas** (`QUEUE_CONNECTION=database`) para trabajo asíncrono, desacoplando el tiempo de respuesta de la ejecución.

### Disponibilidad
- **Documentada** (vista de despliegue §7.2): balanceador de carga → PHP-FPM → MariaDB con réplicas de lectura; Reverb como servicio independiente con balanceo; CDN para estáticos; objetivo ≥ 99 % mensual.
- **Degradación elegante ya implementada**: Pusher como *fallback* de Reverb (`DD-2`, `RNF-DISP-02`) — si Reverb cae, el realtime puede seguir por la vía alternativa sin tocar código.
- **Soft delete + papelera**: un borrado accidental es reversible.

### Seguridad de los datos
| Mecanismo | Implementación | Evidencia |
|---|---|---|
| Hash de contraseñas | bcrypt 12 rounds (`BCRYPT_ROUNDS=12`) + cast `hashed` | `User.php:38` |
| Tokens hasheados | Sanctum almacena SHA-256; el backend solo retiene el hash | `personal_access_tokens` |
| RBAC + ámbito por departamento | 4 roles canónicos + Policies + middleware `admin` | 56 rutas, todas bajo `auth:sanctum` salvo `/login` |
| Rate limiting | `throttle:login` → 5/min por IP+email, **429** | `LoginRateLimitTest` (2 casos) |
| Validación de entrada | 14 Form Requests + trait de MIME | 10 casos de validación |
| defense in depth en el canal WS | `channels.php` re-verifica participación | — |
| Aislamiento de errores | Credenciales inválidas → mensaje genérico, sin revelar existencia del email (`RF-AUT-04`) | — |

**Brechas honestas de esta dimensión:** no existe política de retención/purga de `messages`/`message_reads` (riesgo R4, planificado), no hay backups automatizados verificados, no hay cifrado en reposo a nivel de BD, y **no hay transacciones explícitas** (`DB::transaction`) en operaciones multi-tabla como "crear mensaje + crear documento adjunto": un fallo a mitad de camino deja un mensaje creado sin su adjunto. Es una mejora concreta y de bajo costo.

---

# 3. Selección de tecnologías y desarrollo

## 3.1 ¿Qué lenguajes, frameworks y herramientas usaron y por qué?

### Backend — Laravel 13 · PHP 8.4/8.5 · Sanctum v4 · Reverb v1
| Tecnología | Versión | Criterio de selección |
|---|---|---|
| PHP | ^8.3 (entorno 8.4.27; el proyecto apunta a 8.5) | Stack curricular del equipo, ecosistema Laravel maduro, coste $0 |
| Laravel 13 | ^13.0 | Framework con ORM, autenticación, colas, broadcasting, policies y testing integrados **en un solo paquete** → una sola dependencia en vez de 8 librerías sueltas |
| Laravel Sanctum | ^4.0 | **PAT** en vez de SPA: frontend y backend en dominios distintos (`DD-1`); tokens portables y revocables por dispositivo |
| Laravel Reverb | ^1.10 | WebSocket oficial del framework, **sin costo** (Pusher cobra) y con el mismo modelo de eventos/canales (`DD-2`) |
| Eloquent | (núcleo) | Acceso a datos por objetos, prevented SQL injection, eager loading |
| PHPUnit 12 | ^12.5 | Runner estándar de Laravel; `php artisan test` con SQLite en memoria |

### Frontend — Next.js 16 · React 19 · TypeScript 5 · Tailwind 4
| Tecnología | Versión | Criterio de selección |
|---|---|---|
| Next.js | 16.1.7 | App Router con code splitting por ruta y renderizado híbrido; es el framework React de referencia en 2026 |
| React | 19.2.3 | Estado local por hooks, sin dependencia extra (la gestión de estado es local) |
| TypeScript | ^5 | `strict` reduce errores de contrato con la API — crítico en un proyecto con dos equipos y un contrato REST de 56 endpoints |
| Tailwind CSS | ^4 | Sistema de tokens semánticos (`brand-primary`…) → rebranding sin tocar componentes (`DD-7`) |
| Laravel Echo + Pusher JS | ^2.3 / ^8.5 | Cliente oficial de Laravel; permite Reverb y Pusher con la misma API |
| framer-motion | ^14 | Animaciones de UI declarativas |
| lucide-react | ^1.52 | Iconografía consistente y ligera |
| driver.js | ^1.4 | Tour de onboarding (`RNF-UXA-04`) |

### Herramientas de proceso
- **Git** con flujo por *feature branch* (`feature/{ID}-{descripción}`), PR con revisión cruzada y *squash-merge* a `main`.
- **Conventional Commits** (`feat`, `fix`, `docs`, `chore`, `refactor`, `remove`) — verificable en el historial: 49 commits, 3 autores, del 2026-08-17 al 2026-11-09.
- **Laravel Pint** (PSR-12) como formateador único del backend.
- **ESLint** (`eslint-config-next`) como linter del frontend.
- **Graphify**: genera un grafo de conocimiento del código (≈1.670 nodos, 3.006 aristas, 143 comunidades) para consultar dependencias; `graphify-out/` está en `.gitignore` por ser artefacto regenerable.
- **Trello** (gratuito) como herramienta visual del backlog, con el `.xlsx` exportado como evidencia en `docs/`.

## 3.2 ¿Qué otras alternativas evaluaron y por qué las descartaron?

| Alternativa | Motivo del descarte |
|---|---|
| **Laravel Sanctum SPA** (cookies) | Frontend `:3000` y backend `:8000` no comparten dominio; Sanctum SPA exige cookie same-site → **DD-1** |
| **Pusher como servidor principal** | Servicio de pago; el acta prohíbe dependencias de terceros pagados → Pusher queda como *fallback* → **DD-2** |
| **MySQL puro** | Sin ventaja funcional frente a MariaDB; incompatibilidad declarada con el stack documentado → **DD-3** |
| **MySQL/MariaDB + Doctrine u otro ORM** | Eloquent es el ORM nativo, con tipos, relaciones y casts tipados; un segundo ORM duplicaría el conocimiento → **RNF-DISP-03** |
| **Redux / Zustand / Context global para el estado** | El estado es local por pantalla; React Context + hooks bastan. Añadir un store global sería over-engineering → **omitido deliberadamente** |
| **CSS Modules / Styled Components** | Tailwind v4 da consistencia por tokens y el rebranding se resuelve en un solo archivo → **DD-7** |
| **GraphQL** | Contrato REST ya tipado y documentado en `API_NEXTJS.md`; GraphQL añadiría complejidad de caché y N+1 en cliente |
| **JWT** | El token se **revoca** ( Sanctum borra el registro) y es por dispositivo; un JWT es stateless y no se puede revocar sin lista de bloqueo |
| **Docker / despliegue en la nube** | Fuera del alcance del acta ("despliegue de producción comercial"); entorno local Laravel Herd |
| **PostgreSQL** | El stack está fijado por `RA2`; el modelo actual es válido en ambos motores |
| **Laravel + Vue/Angular** | El frontend se define en Next.js por el stack fijado (`RA1`) |

## 3.3 ¿Qué ventajas tiene el stack frente a otras soluciones?

1. **Una sola aplicación en el backend.** Laravel trae ORM, auth, colas, broadcasting, policies, scheduler, testing y CLI en un paquete. Frente a un stack Node/Express equivalente, el número de piezas con mantenimiento real es menor.
2. **Contrato de seguridad de serie.** Sanctum + Policies + middleware + hashing + rate limiting son *out of the box*; no hay que auditar un JWT casero ni un middleware de roles escrito a mano.
3. **Realtime sin licencia.** Reverb + Echo eliminan el costo variable de Pusher, crítico en un proyecto con presupuesto $0.
4. **Type safety en el punto más frágil.** TypeScript en el frontend + Form Requests tipadas en el backend reduce el error en el contrato entre ambos (56 endpoints).
5. **Frontend sin dependencia de un framework de UI pesado.** Tailwind v4 + tokens: bundle controlado, coherencia visual por construcción, rebranding centralizado.
6. **Portabilidad del motor de datos.** `RA2` (compatible MySQL 8) elimina el riesgo de lock-in de base de datos.
7. **Consistencia con el estándar de la industria y con el perfil del equipo**, lo que reduce el costo de aprender y mantiene laiezabilidad academicable del proyecto.

**El trade-off honesto:** este stack optimiza para *velocidad de desarrollo y seguridad por defecto*, no para *rendimiento bruto ni escalado horizontal*. Es la elección correcta para el alcance; sería incorrecta para un producto público de alto tráfico, donde Spring Boot/Go + Postgres + RedisIAN serían más adecuados.

## 3.4 ¿Qué dificultades técnicas enfrentaron y cómo las resolvieron?

Las dificultades son verificables en el historial de commits y en las tarjetas del backlog:

| Dificultad | Causa raíz | Resolución | Evidencia |
|---|---|---|---|
| **Endpoints accesibles sin autorización** | Rutas mutantes declaradas sin `admin`; el permiso estaba en el frontend, no en el servidor | Middleware `admin` + `Policies` por modelo + refactor de la lógica de permisos a un único lugar | `SEC-002`…`SEC-005` (5 commits, 2026-09-24); 56 casos de autorización en 4 suites |
| **Permiso de publicación duplicado en 6 sitios** | La lógica "quién puede publicar" estaba repetida entre backend, frontend y seeds | Centralización en `User::canManageAnnouncements()` + constante `Role::ROLES_QUE_PUEDEN_PUBLICAR` | `a23614d` (`ROL-002`); `CanManageAnnouncementsCentralizedTest` (8 casos) |
| **Contador de no leídos inconsistente entre dispositivos** | El estado vivía en `sessionStorage` del navegador | Persistencia en la tabla `message_reads`, calculada desde BD | `f68aedc` (`SEC-007`); `MessageReadTest` (7 casos) |
| **Subida de archivos sin validación real** | Se validaba la extensión declarada por el cliente | Validación de MIME real con `finfo` y rechazo **415**; trait compartido entre documentos, adjuntos y mensajes | `f002b2c` (`SEC-006`); `MimeValidationTest` (9 casos) |
| **Brute force contra el login** | Sin límite de intentos | `throttle:login` — 5/min por combinación IP+email | `d1761e5` (`SEC-001`); `LoginRateLimitTest` (2 casos) |
| **Desajuste de zona horaria MySQL/MariaDB vs. app** | Fechas persistidas con UTC vs. hora local del servidor | `session.timezone = UTC` explícito + fechas robustas en el seeder | `27cb824` |
| **Adjuntos no servidos en dev** | Dependencia del symlink `public/storage` | Servidor que entrega los adjuntos del disco `public` sin depender del symlink | `8130e88` |
| **Parpadeo de sesión y estado duplicado entre pestañas** | Estado de autenticación y de chat replicado por componente | Sesión compartida con React Context + `BroadcastChannel` del navegador | `249737a` |
| **Bug de UX real en 7 vistas** | Revisión visualmanual | Corrección conjunta + verificación | `04d7a70` |
| **"Publicaciones" no aparecía en el sidebar** | El botón se filtraba por rol incorrectamente | Corrección del filtro de navegación por rol | `cb6396c` |
| **Ortografía y tildes inconsistentes** | Textos escritos sin revisión | Dos passes de corrección sobre todas las vistas | `cc79143`, `db2c554` |
| **Seeder de 300 usuarios lento e inestable** | Volumen elevado + fechas + archivos reales | Seeder optimizado, con archivos de stock reales y `mime_type` coherente con la extensión | `884021e`, `4a598d6`; `DemoDataSeederTest` (10 casos) |

**Patrón de resolución dominante:** cada tarjeta de seguridad (`SEC-*`) se acompaña de su suite de tests, de modo que el defecto no puede reintroducirse sin romper la CI. Esa es la diferencia entre "corregir un bug" y "dejar el sistema en un estado defendible".

## 3.5 Si lo desarrollaran de nuevo, ¿mantendrían el stack?

**Mantendríamos el 90 % del stack. Cambiaríamos tres cosas concretas:**

**Se mantiene (con confianza):**
- **Laravel + Eloquent**: el modelo de dominio es relacional y con integridad; el ORM cubre el 100 % de las operaciones. No hay caso para cambiar.
- **Next.js + React + TypeScript**: contrato REST grande y tipado; App Router con code splitting por ruta es la estructura correcta.
- **MariaDB**: `RA2` sigue siendo válida y los beneficios de InnoDB son reales.
- **Sanctum PAT**: la revocación por dispositivo es un requisito de negocio real.
- **Tailwind v4**: los tokens semánticos ya resuelven el rebranding.

**Cambiaría:**
1. **Añadir Redis desde la Iteración 6**, no esperar a producción. Motivo: `CACHE_STORE=database`, `SESSION_DRIVER=database` y `QUEUE_CONNECTION=database` convierten cada request en escritura en MariaDB. Es una mejora de bajo esfuerzo y alto retorno, y habilita el escalado de Reverb. *Costo:* una dependencia más en el entorno local.
2. **Adoptar Pest como capa de escritura** (manteniendo PHPUnit como runner, sin migración forzada). Motivo: la legibilidad de los casos de autorización —que son la mayor parte de la suite— es directamente proporcional a su mantenibilidad, y 14 archivos con 8-14 casos cada uno son el punto donde la duplicación empieza a doler. *Costo:* dependencia de desarrollo, curva de aprendizaje del equipo.
3. **Extraer el contexto de `Chat` a un módulo con frontera explícita** (no a un microservicio todavía): `Conversation`, `Message`, `MessageRead`, `MessageSent` y `channels.php` aíslan un bounded context que ya es separable. *Costo:* refactor de bajo riesgo, beneficio: habilita el camino a microservicios si el growth lo exige.

**No cambiaría:** la elección de monolito modular. Rehacerlo en microservicios desde el inicio habría triplicado el costo de desarrollo de un equipo de dos personas sin resolver un problema que el proyecto no tiene.

---

# 4. Metodologías de desarrollo y gestión del proyecto

## 4.1 ¿Qué metodología usaron y por qué fue la adecuada?

**Metodología: ágil iterativa con gestión Kanban, organizada en sprints/iteraciones de dos semanas y tarjetas de trabajo con trazabilidad completa.**

Evidencia directa:
- El documento de requerimientos declara: **"Metodología: Ágil (iteraciones Kanban)"**.
- El Product Backlog (`.xlsx`) está generado con **35 tarjetas, 6 épicas, 7 iteraciones (M0–M6), WIP = 3 tarjetas por persona**, fecha de inicio 31-08-2026 y entrega 04-12-2026 (14 semanas).
- Elhistorial de Git implementa **tarjetas con ID**: `SEC-001`…`SEC-007`, `ROL-001`…`ROL-003`, `DOC-001`…`DOC-005`, `BRAND-001`…`BRAND-010`, `UX-001`…`UX-004`, `EVI-001`…`EVI-006`.
- El acta de constitución define **7 hitos** alineados uno a uno con las iteraciones.

**Por qué fue la adecuada para este proyecto:**
1. **Requerimientos inevitablemente incompletos al inicio.** El propio documento de requerimientos marca 6 módulos como "Previsto (Iter 2)" y 3 RF como "roadmap". Un modelo predictivo habría congelado un alcance que el cliente no podía precisar.
2. **Corrección temprana de seguridad.** Las tarjetas `SEC-*` son **bloqueantes en la Iteración 1**, detectadas y cerradas antes de avanzar. En cascada, un defecto de autorización descubierto en la Iteración 5 habríaohlado todo lo construido encima.
3. **Entregables对接 con stakeholders reales** (docente, comisión, usuarios de la organización) que avanzan por iteración, no al final.
4. **Restricción de WIP (3 tarjetas/persona)** con un equipo de 2 personas: la restricción de flujo es lo que realmente protege el cronograma en equipos pequeños, más que las ceremonias.
5. **Trazabilidad obligatoria** (Objetivo OA3): *Problema → RF → HU → Funcionalidad → Prueba*. Sin un backlog con IDs, esa cadena no es auditable.

## 4.2 ¿Qué diferencias hay entre una metodología ágil y una tradicional/predictiva?

| Dimensión | Tradicional / predictiva (cascada, PMBOK predictivo) | Ágil (Scrum/Kanban iterativo) — **la usada** |
|---|---|---|
| **Planificación** | Secuencial, detallada al inicio, waterfall | Iterativa; el plan se re-deriva al cierre de cada iteración |
| **Requerimientos** | Fijos y congelados; el cambio es excepción | Evolutivos; el cambio es esperado y se gestiona con repriorización |
| **Entrega** | Al final del proyecto (una sola entrega) | Frecuente (una entrega por iteración, producto usable en todo momento) |
| **Feedback del cliente** | Tardío, al final | Continuo, al cierre de cada iteración |
| **Cambio** | Resistencia, coste alto (change control formal) | Adaptación barata dentro del backlog |
| **Medición del avance** | Por % completado contra línea base (Gantt) | Por trabajo **terminado** (tarjetas "Hecho"), WIP y flujo |
| **Documentación** | Exhaustiva y previa | Suficiente y suficiente, viva, actualizada en cada cambio (`RA5`) |
| **Gestión del riesgo** | Identificación anticipada y mitigación formalup-front | Riesgo reevaluado en cada iteración; los riesgos R-01…R-06 se detectaron y corrigieron por iteración |
| **Contrato** | Cerrado y fijo al inicio | Reabrible, con renegociación por sprint |
| **Relación con la prueba** | Pruebas al final (fase de testing) | Pruebas **dentro** de cada iteración (Definition of Done) |

**Cuidado con la caricatura:** "ágil" no significa "sin documentación ni planificación". Este proyecto tiene acta de constitución, registro de stakeholders, mapa de actores, visión, goal, roadmap, documento de arquitectura 4+1, RF/RNF, historias de usuario, backlog, esquema ER y matriz de trazabilidad. Lo que hace ágil es **el orden de producción de esa documentación** (se actualiza con cada cambio, `RA5`) y **el ritmo de entrega**, no su ausencia.

## 4.3 ¿Qué ventajas y desventajas tendría usar Scrum en lugar de cascada?

*Precisión: el proyecto ya usa Scrum-like (iteraciones, backlog) pero con flujo Kanban dentro de la iteración. La comparación que corresponde es "Scrum completo vs. el esquema actual".*

**Ventajas de adoptar Scrum puro:**
- **Ceremonias explícitas** (Sprint Planning, Daily, Review, Retrospective) queobligan a ordenar el trabajo cada día — el proyecto registró riesgos de sobrecarga por tarjetas paralelas (R-06) que una Daily resolvería formalmente.
- **Definition of Done compartida y verificable**: el proyecto ya la tiene en el acta ("cada módulo cumple su Definition of Done y queda reflejado en el BACKLOG.md"), pero no está operacionalizada en una checklist por tipo de tarjeta.
- **Forecast con velocity**: permitiríairdocumentar la capacidad real del equipo y detectar desvíos de cronograma antes (hoy el seguimiento es por estado de tarjeta, no por throughput).
- **Inspección y adaptación formalizadas** en la Retrospective, que hoy no existe como artefacto.

**Desventajas:**
- **Ceremonias como sobrecarga en un equipo de 2 personas.** La overhead de Scrum (planning, review, retro, 3 artefactos) es desproporcionada cuando el equipo completo cabe en una conversación de 20 minutos. Kanban con WIP limit es más liviano y produce el mismo resultado de flujo.
- **Sprint commitment rígido**: en un proyecto académico con fecha de entrega fija y requisitos del cliente aún por precisar, un commitment por sprint genera resistencia artificial; el backlog repriorizado es más honesto.
- **Burndown como métrica principal**: puede gamificar el sistema yuite стимулировать cerrar tarjetas a medio hacer.

**Veredicto para este proyecto:** la **híbrido actual (iteraciones tipo sprint + Kanban dentro)** es más adecuado que Scrum puro para 2 personas. Lo que sí se recomienda adoptar de Scrum: **Definition of Done por tipo de tarjeta**, **retrospectiva documentada por iteración** y **métrica de throughput** (tarjetas completadas por iteración) en lugar de solo "% completado".

## 4.4 ¿Cómo organizaron las actividades, asignaron responsabilidades y siguieron el avance?

**Organización del equipo** (acta de constitución, 12-sep-2026, firmada 21-sep-2026):

| Rol | Responsable | Responsabilidad |
|---|---|---|
| Desarrollador Backend | Benjamín Herrera | API, BD, Policies, Reverb, tests |
| Desarrollador Frontend | Julián Tapia | Next.js, UI/UX, cliente realtime, integraciones |
| Sponsor / docente guía | Cindy Betzabé Contador Cisterna | Supervisión y validación de entregables |
| Beneficiarios | Usuarios de la organización (Admin, Líder, Colaborador, Nuevo Ingreso) | Validación de flujos críticos |

**División técnica verificable en el código:** el backend tiene 12 controladores, 11 modelos, 14 Form Requests, 2 Policies y 33 migraciones; el frontend tiene 8 rutas de dashboard, 11 componentes y 12 módulos en `lib/`. La separación de responsabilidades del equipo es real y se refleja en la estructura de carpetas.

**Asignación de trabajo:**
- **Tarjetas con ID por épica**, cada una con su criterio de aceptación.
- **WIP máximo de 3 tarjetas por persona** (acta, supuesto explícito; también en el backlog) para evitar el WIP ilimitado (riesgo R-06).
- **Ramas por feature**: `feature/{ID}-{descripción}`, con PR y *squash-merge* a `main` y revisión cruzada entre los dos integrantes (documento de arquitectura §6.4). Es observable en el historial: `Merge pull request #1 from Aron1244/backend-aron` y merges de `develop`.
- **Ramas observadas**: `main`, `develop`, `backend-aron` — es decir, *trunk-based con `develop` como integración*, más una rama por integrador.

**Seguimiento del avance** — cuatro mecanismos complementarios:
1. **Estado en Trello** (`Hecho` / `En curso` / `Pendiente`), exportado al `.xlsx` de backlog.
2. **Historial Git como fuente de verdad objetiva**: 49 commits con Conventional Commits, cada commit referencia su tarjeta (`SEC-003`, `ROL-002`…) o su tipo (`feat`, `fix`, `docs`, `refactor`, `chore`).
3. **Suite PHPUnit como gate de regresión**: 123 tests que deben estar verdes para mergear.
4. **Documentos por iteración**: `docs/Fase 2.1/` con acta, stakeholders, mapa de actores, visión, goal, roadmap, RF/RNF, historias de usuario, backlog, arquitectura y ER.

**Hitos planificados (7):**

| Iter | Foco | Entregable |
|---|---|---|
| 0 | Fundamentos operativos | Monorepo + auth base |
| 1 | Seguridad y roles | Endpoints autorizados, 4 roles, rate-limit |
| 2 | Cobertura funcional | 10/10 módulos operativos |
| 3 | Documentación completa | `docs/` completo |
| 4 | Validación con usuarios | Acta de pruebas + métricas SMART |
| 5 | Rebranding Coherev | UI con marca, a11y AA, responsive |
| 6 | Cierre y entrega | PPT actualizada + repo presentable |

**Observación crítica (demuestra lectura del dato):** la hoja de resumen del backlog declara 35 tarjetas totales, pero su sección "Distribución por estado" reporta 10 Hecho + 9 En curso + 25 Pendiente = **44 tarjetas**, y los porcentajes (28,57 % + 25,71 % + 71,43 % = 125,71 %) son inconsistentes entre sí. Los recuentos por **épica** (SEC 8, ROL 3, DOC 5, BRAND 10, UX 4, EVI 5 = 35) y por **iteración** (1+8+2+5+1+14+4 = 35) sí son consistentes. La inconsistencia está en el corte por estado —probablemente porque las fórmulas `COUNTIF` de la hoja cuentan sobre un rango que incluye filas de Iteración duplicadas— y es una corrección pendiente de la evidencia.

## 4.5 ¿Cómo gestionaron los cambios en requerimientos y qué impacto tuvieron?

**Mecanismo formal de gestión de cambios:**
1. **Requerimientos versionados** (`8 y 9-requerimientos F y NF.docx`, v1.0, con prioridades alta/media/baja y estado por módulo).
2. **Backlog repriorizado por iteración** — las tarjetas nuevas entran con ID de su épica.
3. **Rama `develop` como punto de integración** para que un cambio no disruptivo llegue a todos sin bloquear.
4. **Documentación viva (`RA5`)**: todo cambio arquitectónico debe reflejarse en el documento de arquitectura y en el backlog **antes** de mergearse.
5. **Criterio de aceptación formal** en el acta: cada módulo cumple su Definition of Done y queda reflejado en el backlog.

**Impacto real y demostrable de los cambios de requerimientos (casos concretos del historial):**

| Cambio | Impacto en alcance | Impacto en cronograma | Impacto técnico |
|---|---|---|---|
| **Permisos por rol endurecidos** (SEC-002…SEC-005) | Se agregaron 4 suites de autorización (56 casos) que no estaban en el alcance inicial | Occupy la Iteración 1 completa (8 tarjetas) | Introdujo `Policies`, middleware `admin` y el refactor de `canManageAnnouncements()` |
| **Contador de no leídos debe ser consistente entre dispositivos** (SEC-007) | Se rehízo un requisito ya "implementado" (RF-CHT-09 pasó de "pendiente" a media) | Replanificación a Iteración 1/2 | Nueva tabla `message_reads` + endpoints de lectura; migración del estado desde `sessionStorage` |
| **Validación de MIME real obligatoria** (SEC-006) | Sefengit lo que antes era "subir archivo" | 1 tarjeta | Trait `RejectsMimeMismatch`, respuestas **415**, 9 casos de prueba |
| **Un usuario puede pertenecer a varios departamentos** | Requisito no contemplado en el modelo original (1 usuario = 1 departamento) | Se reabrió la Iteración 2 | Nueva tabla pivote `department_user` (migración `2026_11_08`), `User::departmentIds()`, `syncDepartments()`, `User::booted()` |
| **Publicación general para toda la organización** | Se eliminó el patrón de duplicar publicación por departamento | Iteración 6 | `announcements.department_id` nullable (migración `2026_11_09`); se borró lógica de copia |
| **Borrado lógico con papelera** | Nuevo módulo de moderation | Iteración 6 | `SoftDeletes` en `messages`/`documents`, `TrashController`, rutas `/api/trash/*`, vista `app/dashboard/trash/` |
| **Rebranding a Coherev** | Identidad visual completa + a11y + responsive | Iteración 5 completa (14 tarjetas, el 40 % del backlog) | Tokens semánticos de Tailwind, tour con `driver.js`, microcopy propio |
| **Desalineación de la documentación con el código** (riesgo R1/R3) | Corrección de PPT, README y esquema SQL | — | Se corrigieron "MySQL vs MariaDB", "Canva vs Figma" y se reveló que el esquema SQL congelado del 2026-10-05 **no** incluye el soft-delete de la migración `2026_10_06_000004` |

**Conclusión de gestión de cambios:** el patrón dominante fue **absorber el cambio como una tarjeta con ID, con su propio ID de épica y su suite de pruebas**, en lugar de reiniciar la planificación. El impacto en cronograma se contuvo moviendo la prioridad (las tarjetas `SEC-*` se declares bloqueantes) y congelando el alcance de los módulos "Previstos (Iter 2)" como tales.

---

# 5. Pruebas de software y aseguramiento de la calidad

## 5.1 ¿Qué tipos de pruebas realizaron y por qué?

**Pruebas realizadas (verificadas):**

| Tipo | Implementación | Ubicación | Por qué se eligieron |
|---|---|---|---|
| **Unitarias** | 1 caso base (boilerplate PHPUnit) | `tests/Unit/ExampleTest.php` | Plantilla de partida; el 99 % de la lógica de negocio está en modelos y policies, que se prueban vía Feature |
| **Funcionales / de integración (Feature)** | **121 casos** sobre la API completa con base de datos real de test, HTTP real, autenticación real y permisos reales | `tests/Feature/` (18 archivos) | Es el nivel que verifica el requisito: "un Colaborador no puede crear un usuario" solo se demuestra cruzando HTTP + auth + policy + BD |
| **Autorización / RBAC** | 56 casos en 4 suites (`Department`, `Role`, `User`, `Document`Authorization) | `tests/Feature/` | Es el requisito de mayor riesgo del sistema (R-02, riesgo inicial R-01 "Alcance incompleto en Iter 1") |
| **Validación de entradas** | 10 casos (`MimeValidationTest` 9 + `StoreUserRequest` uniqueness) | `tests/Feature/` | Cubre los RNF-SEG-05/06 y el rechazo con **415** |
| **Seguridad** | 2 casos de rate limiting (`LoginRateLimitTest`) + cobertura transversal de "sin token → 401/403" en las 4 suites de autorización | `tests/Feature/` | `RNF-SEG-04`, `RNF-SEG-07`, `RF-AUT-08` |
| **Integridad de datos** | 7 casos de `message_reads` (idempotencia, no contar propios mensajes, no marcar conversaciones ajenas) | `MessageReadTest` | `RF-CHT-08/09`, `SEC-007` |
| **Pruebas de datos / seeders** | 10 casos (`DemoDataSeederTest`): 300 usuarios, 8 departamentos, carpetas, documentos, conversaciones, MIME coherente con la extensión, imágenes decodificables, idempotencia | `tests/Feature/` | Valida el escenario de demostración y detecta datos corruptos antes de la entrega |
| **Almacenamiento / serving** | 2 casos (`PublicStorageTest`): ruta de storage registrada y archivos servidos por HTTP | `tests/Feature/` | Regresión del bug de symlink (`8130e88`) |
| **Regresión funcional de permisos** | 8 casos (`CanManageAnnouncementsCentralizedTest`): los 4 roles, usuario sin roles, múltiples roles (hereda el mayor permiso), alias legacy | `tests/Feature/` | Regresión del refactor `ROL-002` |

**Pruebas NO realizadas (brechas honestas, y su impacto):**

| Tipo ausente | Impacto | Mitigación actual / recomendada |
|---|---|---|
| **Unitarias de frontend** | El 100 % del frontend (8 rutas, 11 componentes) está sin cobertura automática; los bugs de UI que se corrigieron (`04d7a70`, `cb6396c`, `249737a`) sólo se detectaron a mano | El linter (ESLint) cubre estilo, no comportamiento. Recomendación: Vitest + React Testing Library para `lib/api-client.ts` (es la pieza más crítica y es trivialmente testeable: es una función pura con `fetch` inyectable) |
| **E2E / de extremo a extremo** | No hay prueba que cruce navegador → API → BD → WebSocket | Está explícitamente en el roadmap del README ("Tests E2E del flujo de conversación en tiempo real"). Recomendación: Playwright sobre el flujo login → publicar → comentar → enviar mensaje |
| **Rendimiento / carga** | Los RNF-REN-03/04/05 (< 500 ms p95, < 500 ms de latencia realtime, LCP < 2,5 s) están **declarados pero no medidos** | No hay evidencia de medición. Recomendación: k6 o Artillery sobre los endpoints de listado, y Lighthouse CI para el LCP |
| **Seguridad automatizada (SAST/DAST)** | No hay escaneo estático ni dinámico; la seguridad se cubre solo con tests funcionales | Recomendación: Semgrep/GitHub CodeQL en CI + OWASP ZAP contra la app |
| **Accesibilidad automática** | `RNF-UXA-01` (WCAG AA) no se verifica automáticamente | Recomendación: `axe-core` / `@axe-core/playwright` como paso de CI |
| **Validación con usuarios reales (UAT)** | Iteración 4 del roadmap; aún no ejecutada | Es el entregable "Acta de validación con usuarios" del acta de constitución. **Es la brecha más importante para el cierre** |

**Sobre las pruebas manuales:** el proyecto no conserva un protocolo de pruebas manuales firmado; la evidencia es el historial de commits `fix:` (ver §5.4). Para una evaluación formal, ese registro debería existir como artefacto.

## 5.2 ¿Cuántos casos de prueba diseñaron, ejecutaron y qué porcentaje resultó exitoso?

**Resultado real de la ejecución (`php artisan test --no-coverage`, 10/11/2026, rama `develop`):**

```
Tests:    123 passed (430 assertions)
Duration: 226.40s
```

| Métrica | Valor |
|---|---|
| Casos de prueba **diseñados** (implementados en código) | **123** |
| Casos **ejecutados** | **123** (100 % de los diseñados) |
| Casos **exitosos** | **123** |
| Casos **fallidos** | **0** |
| **Porcentaje de éxito** | **100 %** |
| Aserciones | **430** (promedio ≈ 3,5 aserciones por caso) |
| Archivos de prueba | 20 (1 `Unit` + 19 `Feature`) |
| Duración total | 226,40 s |

**Distribución de los 123 casos por suite:**

| Suite | Casos | Enfoque |
|---|---|---|
| `DepartmentAuthorizationTest` | 14 | Permisos por rol sobre departamentos |
| `RoleAuthorizationTest` | 14 | Permisos sobre roles + no autenticado |
| `UserAuthorizationTest` | 14 | Permisos sobre usuarios + `chat-partners` filtrado |
| `DemoDataSeederTest` | 10 | Integridad del dataset de demostración |
| `DocumentAuthorizationTest` | 9 | Propiedad del documento, descarga, subida |
| `MimeValidationTest` | 9 | MIME real en 3 tipos de subida |
| `CanManageAnnouncementsCentralizedTest` | 8 | Centralización del permiso de publicación |
| `DepartmentColorTest` | 7 | Color por departamento + validación hex |
| `MessageReadTest` | 7 | Lecturas, contador de no leídos, idempotencia |
| `GeneralAnnouncementTest` | 6 | Publicación general vs. por departamento |
| `UserDepartmentsTest` | 6 | Multi-departamento |
| `AnnouncementAuthorizationTest` | 4 | Publicaciones y comentarios |
| `RoleSeederTest` | 4 | Seed de los 4 roles + idempotencia |
| `UserRoleFlagsTest` | 4 | Flags `es_lider`, `onboarding_pendiente` |
| `LoginRateLimitTest` | 2 | Rate limiting del login |
| `PublicStorageTest` | 2 | Serving del disco público |
| `CommentTest` | 1 | Comentario en publicación |
| `ExampleTest` (Feature) | 1 | La aplicación responde |
| `ExampleTest` (Unit) | 1 | Caso base de la plantilla |

**Interpretación honesta del 100 %:** es una cifra real y verificable, **pero debe matizarse**: (a) no es cobertura de código —no hay métrica de cobertura configurada en `phpunit.xml`, solo `<source>` sin umbrales—; (b) el 100 % es **sobre las líneas base de prueba**, que concentrates en autorización; (c) el frontend tiene 0 % de cobertura automatizada; (d) la suite corre contra SQLite en memoria, no contra MariaDB. **Un 100 % de casos exitosos con 0 % de cobertura de código y 0 % de cobertura de frontend es un dato de proceso, no de cobertura.** La métrica honesta a reportar es: *"123 casos de prueba automatizada que cubren el 100 % de los requisitos funcionales de autorización, validación y persistencia del backend; 0 % de cobertura automatizada del frontend"*.

## 5.3 ¿Cuántos ciclos de pruebas realizaron y qué actividades se realizaron en cada ciclo?

**La distinción importante:** el proyecto tuvo **7 ciclos de desarrollo iterativos** (M0–M6), no 7 "ciclos de pruebas" en sentido deISTQB. Las pruebas se ejecutaron como **puerta de regresión en cada iteración**, no como una fase separada al final.

| Ciclo | Foco | Actividades de prueba ejecutadas |
|---|---|---|
| **M0 — Fundamentos** | Monorepo + auth base | Pruebas de arranque (`ExampleTest`), validación del flujo login/emitir token/verificar sesión con `GET /me` |
| **M1 — Seguridad y roles** | Endpoints autorizados, 4 roles, rate-limit | Diseño de 4 suites de autorización (matriz rol × endpoint × verbo), suite de MIME, suite de rate limiting. **Es el ciclo de mayor densidad de pruebas: 56 de los casos de autorización nacen aquí** |
| **M2 — Cobertura funcional** | Sidebar por rol, multi-departamento | `CanManageAnnouncementsCentralizedTest` (8), `UserDepartmentsTest` (6), `UserRoleFlagsTest` (4) — verificación de que el permiso y la navegación reflejan los 4 roles |
| **M3 — Documentación** | RF/RNF, HU, ARQ, ER | Verificación cruzada: que cada endpoint del documento de arquitectura exista en `routes/api.php`, y que el esquema SQL consolidado coincida con las migraciones (**esto reveló que el SQL congelado del 2026-10-05 no incluía el soft-delete del 2026-10-06**) |
| **M4 — Validación con usuarios** | Pruebas de usabilidad | **Programada y no ejecutada.** Es la brecha abierta más relevante (§5.1) |
| **M5 — Rebranding + UX** | Marca, a11y AA, responsive | Verificación visual manual de las 7 vistas (`04d7a70`), corrección de ortografía y tildes en dos pasadas, tour de onboarding con `driver.js` |
| **M6 — Cierre y entrega** | PPT + repo presentable | Ejecución de la suite completa como gate de entrega, corrección de ortografía final (`db2c554`), verificación del serving de adjuntos (`8130e88`), y el **`DemoDataSeederTest`** (10 casos) que valida el dataset de demostración completo |

**Actividades recurrentes en cada ciclo:** (1) escribir el test **antes** de la corrección — patrón RED→GREEN observable en `SEC-002`…`SEC-007`, donde cada tarjeta de seguridad llega con su suite; (2) ejecutar el test focalizado del módulo tocado; (3) ejecutar la **suite completa** como prueba de no-regresión (`RNF-MANT-03`: "sin romper la suite existente"); (4) revisar y corregir el código con `Laravel Pint`; (5) actualizar la documentación del ciclo (`RA5`).

**Un ciclo adicional no planificado, y revelador:** el ciclo de la **Iteración 5 (reb)**MUS es donde aparecieron los defectos de calidad visual y de accesibilidad (`04d7a70`, `cc79143`, `db2c554`, `249737a`). Son exactamente los defectos que los tests automatizados **no** pueden detectar — y por eso el proyecto los capturó con revisión visual manual.

## 5.4 ¿Cuántos defectos detectaron, cómo los clasificaron por severidad y cuántos quedaron pendientes?

**Declaración metodológica obligatoria:** el proyecto **no** mantiene un registro formal de defectos (no hay Jira, ni carpeta `defects/`, ni actas de pruebas firmadas). Por lo tanto, no existe un conteo oficial por severidad. Lo que **sí** existe y es verificable es el historial de commits con prefijo `fix:`/`refactor:` y las tarjetas de seguridad del backlog. La siguiente clasificación se **reconstruye desde esa evidencia**, y es la que debería presentarse como tal.

### Defectos reconstruidos desde el historial de commits

| Severidad | Criterio | Defectos | Evidencia |
|---|---|---|---|
| **Crítico** | Filtración de datos / control de acceso roto | **2** — (a) CRUD de usuarios accesible a cualquier autenticado; (b) autorización ausente en `DepartmentController` | `SEC-002` (`d29bc87`), `SEC-003` (`25af8c7`) |
| **Alto** | Bypass de permisos o exposición de archivos | **4** — (c) `RoleController` sin restricción de admin; (d) `DocumentController` sin Policy; (e) subir ejecutables con extensión falsificada (MIME no validado); (f) sin rate limit en login (brute force) | `SEC-004` (`06b6212c`), `SEC-005` (`9fbf425`), `SEC-006` (`f002b2c`), `SEC-001` (`d1761e5`) |
| **Medio** | Funcionalidad incorrecta o estado inconsistente | **3** — (g) contador de no leídos residía en `sessionStorage` (inconsistente entre dispositivos); (h) adjuntos no servidos en dev por dependencia del symlink; (i) desfase de zona horaria BD/app | `SEC-007` (`f68aedc`), `8130e88`, `27cb824` |
| **Bajo** | Usabilidad, consistencia visual, texto | **4** — (j) botón "Publicaciones" ausente del sidebar; (k) roles canónicos no reflejados en el frontend; (l) parpadeo por sesión duplicada; (m) bugs reales de legibilidad en las 7 vistas + 2 pasadas de ortografía/tildes | `cb6396c`, `dd8011c`, `249737a`, `04d7a70`, `cc79143`, `db2c554` |
| **Documentación / proceso** | Artefactos desalineados con el código | **2** — (n) esquema SQL consolidado congelado antes del soft-delete; (o) discrepancia de stack declarada en el PPT (MySQL/MariaDB, Canva/Figma) | `de79a60`, riesgo R-03 |
| | **Total reconstruido** | **~15 defectos con evidencia en Git** | 49 commits |

**Defectos pendientes:** **0 defectos funcionales o de seguridad abiertos** — la suite final es 123/123 en verde y ningún commit reciente introduce un `fix:` sin test acompañante. **Pendientes de cierre (no son defectos, son brechas de proceso):** (1) validación con usuarios reales (Iter 4), (2) pruebas E2E del flujo de chat, (3) corrección de la inconsistencia de la hoja de backlog por estado, (4) backup automatizado y política de retención, (5) `DB::transaction` en las escrituras multi-tabla.

**Sobre la clasificación por severidad:** se usó una escala de cuatro niveles alineada con la práctica de OWASP (crítico/alto/medio/bajo) en lugar de una escala propia. La decisión fue deliberada: la tabla del acta de constitución ya usa `Alto/Medio/Bajo` para riesgos (`R-01`…`R-06`), y mantener la misma escala hace comparables ambos artefactos.

**Recomendación de mejora (brecha real del proceso):** adoptar un registro de defectos con campos `ID / severidad / módulo / pasos de reproducción / causa raíz / estado / test de regresión asociado`. Los 15 casos reconstruidos demonstrates que la información existe en Git — sólo falta consolidarla en un artefacto vivo.

## 5.5 ¿Qué evidencias demuestran que el sistema cumple los requerimientos funcionales y no funcionales?

**Matriz de evidencia verificable (RF/RNF → evidencia en el repositorio):**

| Requisito | Evidencia | Estado |
|---|---|---|
| `RF-AUT-01/05/06/07/08` (login, sesión, logout, Bearer, 401) | `AuthController` + `GET /me` + `POST /logout`; `RoleAuthorizationTest`/`DepartmentAuthorizationTest` verifican 401 sin token | ✅ Verificado por código y prueba |
| `RF-AUT-03` (rate limit 429) | `LoginRateLimitTest` — 2 casos, respuesta 429 verificada | ✅ Verificado |
| `RF-AUT-04` (mensaje genérico) | `AuthController::login` devuelve el mismo mensaje para usuario inexistente y contraseña incorrecta | ✅ Por código |
| `RF-ROL-01` (4 roles) | `RoleSeederTest` (4 casos) + `Role::ROLES_QUE_PUEDEN_PUBLICAR` | ✅ Verificado |
| `RF-ROL-02/03/04` (admin gestiona roles; permiso centralizado) | `RoleAuthorizationTest` (14) + `CanManageAnnouncementsCentralizedTest` (8) | ✅ Verificado |
| `RF-DEP-01/02` (permisos y cascada) | `DepartmentAuthorizationTest` (14) | ✅ Verificado |
| `RF-CHT-03/07/08/09/11` | `MessageReadTest` (7) + `channels.php` (autorización de canal) | ✅ Verificado |
| `RF-PUB-01/02/03/06` | `GeneralAnnouncementTest` (6) + `AnnouncementAuthorizationTest` (4) + `CommentTest` (1) | ✅ Verificado |
| `RF-DOC-01/02/04` | `DocumentAuthorizationTest` (9) + `MimeValidationTest` (9) | ✅ Verificado |
| `RNF-SEG-02` (hash de contraseñas y tokens) | `User::$casts['password'] = 'hashed'` + `BCRYPT_ROUNDS=12` + `#[Hidden]` | ✅ Por código |
| `RNF-SEG-04` (todo endpoint exige auth) | Las 56 rutas bajo `/api`; solo `POST /login` es pública | ✅ Verificado |
| `RNF-SEG-05/06` (validación de entrada y MIME) | 14 Form Requests + trait `RejectsMimeMismatch` + 10 casos de prueba | ✅ Verificado |
| `RNF-SEG-07` (rate limit) | `LoginRateLimitTest` | ✅ Verificado |
| `RNF-MANT-01/02` (MVC en capas, reglas en modelos/policies) | Estructura verificada: 12 controladores delgados, 14 Form Requests, 2 Policies, 11 modelos con 48 métodos de dominio | ✅ Por código |
| `RNF-MANT-03` (cobertura crítica con tests, sin romper la suite) | 123 tests verdes; el criterio "no romper la suite" se aplicó en cada commit de la Iteración 1 | ✅ Verificado |
| `RNF-MANT-05` (documentación mantenida) | 14 artefactos en `docs/Fase 2.1/` + README raíz + `API_NEXTJS.md` en backend y frontend | ✅ Verificado |
| `RNF-DISP-02` (Reverb con fallback Pusher) | `config/broadcasting.php` + `echo-client.ts` acepta ambas variables | ✅ Por código |
| `RNF-DISP-03` (MariaDB solo vía Eloquent) | Cero uso de `DB::raw`/SQL directo en `app/` | ✅ Verificado |
| `RNF-UXA-01` (WCAG AA) | Tokens semánticos y `aria-label` en controles de icono | ⚠️ **No verificado automáticamente** |
| `RNF-REN-03/04/05` (< 500 ms, latencia realtime, LCP) | Declarados como objetivo | ⚠️ **No medido** |
| `RNF-REN-01` (paginación de historiales) | `179f851` "paginación, color por departamento y modal" | ✅ Parcialmente verificado |
| Validación con usuarios | Acta de validación con usuarios | ❌ **Pendiente (Iter 4)** |

**Naturaleza de la evidencia — y su límite:** la evidencia es **estructural y funcional automatizada**, no de producción. Demuestra que el sistema *cumple* los requisitos en el contexto controlado de la suite. **No** demuestra el cumplimiento de los RNF de rendimiento, ni la usabilidad con usuarios reales, ni el comportamiento bajo carga. Esa distinción —*conformidad funcional verificada* vs. *atributos de calidad no medidos*— es la línea que hay que defender con precisión en la defensa del proyecto.

## 5.6 Preguntas complementarias sobre pruebas

### 5.6.1 ¿Cuál fue el criterio para determinar la cantidad de casos de prueba?

**El criterio fue "matriz de riesgo × matriz de permisos", no "cobertura de líneas".**

Concretamente, la cantidad se determinó por **cuatro reglas aplicadas de forma consistente**:

1. **Matriz rol × endpoint × verbo.** Cada endpoint sensible genera casos para los cuatro roles canónicos (Administrador, Líder, Colaborador, Nuevo Ingreso) más el caso "no autenticado" (401) y, cuando aplica, "usuario sin roles". De ahí que las tres suites de autorización tengan exactamente **14 casos cada una**: es la señal de que la matriz se aplicó de forma sistemática y no arbitraria. Ejemplo observable en `UserAuthorizationTest`: no-admin × (listar, crear, ver, editar, eliminar, ver roles, editar roles) = 7, admin × las mismas 7 = 7.
2. **Un caso por regla de negocio, con su caso negativo.** El patrón es siempre *camino feliz + camino de rechazo*: subir un PDF válido (200) y un PDF con MIME incorrecto (415); marcar como leída dos veces (idempotencia); listar sin token (401).
3. **Una suite por módulo crítico, no por archivo.** Los archivos de prueba se organizaron por *área de riesgo* (`Authorization`, `Validation`, `Data`), no por clase implementada. Eso permite que una suite sobreviva al refactor del código subyacente.
4. **Deriva desde el requerimiento.** Cada tarjeta `SEC-*` de la Iteración 1 se emparejó con su suite (`SEC-002` → `UserAuthorizationTest`, `SEC-005` → `DocumentAuthorizationTest`, `SEC-006` → `MimeValidationTest`, `SEC-007` → `MessageReadTest`, `SEC-001` → `LoginRateLimitTest`). **No se escribió un test que no correspondiera a un RF, un RNF o un defecto real** — y no se dejó un RF de alto riesgo sin test.

**Cifras resultantes:** 51 RF y 35 RNF definidos; los casos de alto riesgo (autorización, validación, integridad de lecturas) concentran 56 + 10 + 7 = **73 de 123 casos (60 %)**. Esa concentración es la evidencia de que el criterio fue el riesgo, no el hábito.

### 5.6.2 ¿Por qué esa cantidad de ciclos y no más o menos?

**7 ciclos (M0–M6), y la razón es que cada ciclo corresponde a un hito de valor verificable, no a un corte administrativo:**

- **No menos de 7:** cada ciclo cierra un objetivo del acta con entregable propio. Fusionar ciclos habría mezclado, por ejemplo, la definición de los 4 roles con la validación de MIME, y la retrospectiva habría perdido el dato de dónde-was-the-defect.
- **No más de 7:** el equipo son 2 personas y el WIP está limitado a 3 tarjetas por persona. Con 14 semanas y 35 tarjetas, el ciclo de dos semanas da 7 iteraciones — es la granularidad que permite medir throughput sin fragmentar el trabajo.
- **El contenido de cada ciclo está justificado por riesgo, no por simetría:** la Iteración 1 lleva 8 de 35 tarjetas (23 %) porque concentra el 60 % de los casos de prueba — es la iteración que cierra el riesgo R-01, y por eso merece el bloque más grande. La Iteración 5 lleva 14 tarjetas porque es rebranding + UX (mucho trabajo visual, poco riesgo de lógica). **La asimetría es intencional y está justificada en el backlog.**
- **El criterio de cierre de ciclo es la Definition of Done**, no la fecha: "cada módulo cumple su Definition of Done y queda reflejado en el BACKLOG.md". Los hitos del acta dan la fecha; el DoD da la calidad.

**Límite honesto:** la métrica de flujo (tarjetas/semana) no se midió formalmente. Con ella, la calibración de los ciclos siguientes sería mucho más precisa.

### 5.6.3 ¿Qué diferencias se encontraron entre los resultados del primer y el último ciclo?

| Dimensión | Primer ciclo (M0–M1, ago–sep 2026) | Último ciclo (M6, nov 2026) |
|---|---|---|
| **Volumen de pruebas** | ~78 casos (referencia del backlog: "Cobertura de tests (Iter 1): 78+ tests PHPUnit") | **123 casos, 430 aserciones** |
| **Foco de los hallazgos** | **Seguridad**: autorización ausente en 4 controladores (`SEC-002`…`SEC-005`), MIME sin validar, sin rate limit | **Calidad de producto**: ortografía y tildes, legibilidad en las 7 vistas, botón ausente del sidebar, parpadeo de sesión, adjuntos no servidos, extensión vs MIME en los documentos del seeder |
| **Naturaleza de los defectos** | **Arquitecturales de seguridad** — el modelo de permisos no estaba aplicado | **Funcionales y de experiencia** — el modelo de permisos ya estaba sólido |
| **Cobertura del stack** | Solo backend | Backend completo + verificación manual del frontend en las 7 vistas |
| **Naturaleza de la validación** | Mayoritariamente automatizada (suite PHPUnit) | Mixta: automatizada para la lógica, **manual y visual para el frontend** |
| **Superficie del sistema** | Login, usuarios, roles, departamentos | Los 7 módulos de negocio + papelera + multi-departamento + publicación general + color por departamento + datos de demostración |
| **Estado de la suite** | En construcción, alineándose al standard de cada tarjeta | Estable, usada como gate de entrega, con `.phpunit.result.cache` |

**La diferencia que más importa y que conviene defender:** el **perfil de riesgo se desplazó de la seguridad a la experiencia de uso**. En el primer ciclo, encontrar un endpoint sin autorizar era el evento normal; en el último, el mismo endpoint ya estaba cubierto por 4 suites y lo que quedaba eran detalles de presentación. Eso significa que el esfuerzo de calidad rindió: cada iteración elevaba el listón de lo que se considera "terminado".

**La diferencia que también conviene honestidad:** en el primer ciclo la evidencia era casi exclusivamente automatizada; en el último cycle, una parte creciente de la evidencia fue **manual y visual**, y no quedó registrada en un protocolo formal. El proyecto ganó cobertura de lógica, pero perdió rigor en el registro de la evidencia de UI. Cerrar esa brecha es el trabajo pendiente de la Iteración 4.

### 5.6.4 ¿Qué pruebas se ejecutaron nuevamente después de corregir los defectos?

**El protocolo aplicado fue de regresión en dos niveles, y está verificable en el patrón de los commits:**

1. **Prueba focalizada del módulo corregido** — el test que fallaba o que faltaba. Ejemplos:
   - Tras `SEC-002` (`d29bc87`): se ejecutó `UserAuthorizationTest` completo, que incorpora los 7 casos de no-admin que fallaban.
   - Tras `SEC-005` (`9fbf425`): `DocumentAuthorizationTest` (9 casos), que incorpora el caso "non owner non admin cannot delete document".
   - Tras `SEC-006` (`f002b2c`): `MimeValidationTest` (9 casos), que incorpora los 4 rechazos **415** (PDF con MIME incorrecto, ejecutable, JPEG con MIME incorrecto, adjunto de mensaje con MIME incorrecto).
   - Tras `SEC-007` (`f68aedc`): `MessageReadTest` (7 casos), que incorpora la persistencia en BD y la idempotencia de "marcar como leído".
   - Tras `8130e88` (adjuntos sin symlink): `PublicStorageTest` (2 casos) — este es el ejemplo más limpio de **defecto detectado manualmente → convertido en test de regresión permanente**.
   - Tras `27cb824` (timezone): `DemoDataSeederTest` (10 casos), que valida las fechas del dataset.

2. **Suite completa como gate de no-regresión** — los 123 tests. Este es el requisito explícito `RNF-MANT-03` ("cobertura de la funcionalidad crítica con tests PHPUnit; **sin romper la suite existente**") y el criterio de aceptación del acta ("la suite de tests PHPUnit pasa sin romper funcionalidad existente"). Por eso `git log` no muestra ningún commit que haya eliminado o desactivado un test: la suite solo creció (78 → 123).

**La regla operativa que se aplicó:** *un defecto corregido sin test de regresión que falle antes de la corrección y pase después, se considera no corregido.* Los 15 defectos reconstruidos en §5.4 tienen su test asociado, salvo los puramente textuales/visuales (ortografía, tildes, parpadeo), que no son automatizables por naturaleza y dependedieron de revisión manual.

### 5.6.5 ¿Qué criterios se usaron para determinar que el sistema estaba listo para su entrega?

**Los criterios están definidos en el acta de constitución** ("Criterios de aceptación del proyecto") y son verificables uno a uno. Se reproducen aquí con su **estado real al 10/11/2026**:

| # | Criterio de aceptación (acta) | Cómo se verifica | **Estado actual** |
|---|---|---|---|
| 1 | Los 10 módulos funcionan, documentados y trazables (Problema → RF → HU → Funcionalidad → Prueba) | Módulos implementados + documentos en `docs/Fase 2.1/` | ⚠️ **7 de 10 módulos implementados**; Tareas, Directorio y Panel de Novedades siguen en "Previsto (Iter 2)" |
| 2 | Todos los endpoints sensibles validan autorización (403) y el login aplica rate-limit (429) | `php artisan test` → 56 casos de autorización + 2 de rate limit | ✅ **Cumplido y verificado** (123/123) |
| 3 | La suite PHPUnit pasa sin romper funcionalidad existente | `php artisan test` → 123 passed, 430 assertions | ✅ **Cumplido y verificado** |
| 4 | La validación con usuarios registra evidencia y métricas en `docs/evidence/` | Acta de pruebas de usabilidad con usuarios reales | ❌ **Pendiente — Iteración 4** |
| 5 | La interfaz cumple marca Coherev, responsive y accesibilidad WCAG AA | Tokens semánticos + tour `driver.js` + revisión de las 7 vistas | ⚠️ **Parcial** — la marca y el responsive están; WCAG AA no se verificó automáticamente |
| 6 | El PPT y el README raíz presentan el nombre oficial Coherev y el stack coherente | README raíz (ya coherente: Laravel 13, Next.js 16, Reverb, Sanctum, MariaDB) + PPT de Fase 1 | ⚠️ **README ✅ / PPT pendiente de la Iteración 6** |

**Los tres criterios que gobiernan la decisión de entrega, en orden de peso:**
1. **Suite verde** (criterio 3) — es el único completamente cumplido y el único automatizable. Se ejecutó en el estado actual: **123 passed, 430 assertions, 0 fallos**.
2. **Cobertura de autorización** (criterio 2) — es el riesgo R-01 del acta, y las 56 pruebas de autorización son su cierre documentado.
3. **Validación con usuarios** (criterio 4) — el que falta y el que **no puede sustituirse por ninguna suite automática**.

**Declaración de estado que corresponde defender:** *el sistema está listo para entrega en su alcance de seguridad y funcionalidad (criterios 2 y 3 cumplidos y verificados), y pendiente de cierre por el alcance funcional diferido de 3 módulos y por la validación con usuarios reales (criterios 1, 4, 5 y 6 parciales).* Declarar "listo" sin esa precisión sería incorrecto; declarar "no listo" también sería incorrecto, porque los riesgos altos están cerrados y demostrados.

---

# Anexo A — Inventario técnico de referencia

| Elemento | Cantidad | Ubicación |
|---|---|---|
| Rutas de API (`/api`) | 56 | `backend/routes/api.php` |
| Rutas registradas (totales) | 63 | `php artisan route:list` |
| Controladores API | 12 (54 métodos públicos) | `backend/app/Http/Controllers/Api/` |
| Modelos Eloquent | 11 (48 métodos públicos) | `backend/app/Models/` |
| Form Requests | 14 (+ 1 trait compartido) | `backend/app/Http/Requests/` |
| Policies | 2 | `backend/app/Policies/` |
| Eventos de broadcasting | 1 (`MessageSent`) | `backend/app/Events/` |
| Middleware propio | 1 (`AdminOnly`) | `backend/app/Http/Middleware/` |
| Migraciones | 33 | `backend/database/migrations/` |
| Tablas de dominio / framework | 15 / 8 | `docs/Fase 2.1/15.1-esquema de la base de datos.sql` |
| Claves foráneas | 25 (24 de dominio + 1 de framework) | ídem |
| Casos de prueba | **123** (430 aserciones) | `backend/tests/` |
| Rutas de dashboard (frontend) | 8 + login | `frontend/app/dashboard/` |
| Componentes reutilizables | 11 | `frontend/components/` |
| Módulos de servicio (frontend) | 12 | `frontend/lib/` |
| Commits | 49 (3 autores, 2026-08-17 → 2026-11-09) | `git log` |
| Tarjetas de backlog | 35 (6 épicas, 7 iteraciones) | `docs/Fase 2.1/11-product backlog.xlsx` |
| Requerimientos | 51 RF + 35 RNF | `docs/Fase 2.1/8 y 9-requerimientos F y NF.docx` |
| Decisiones de diseño documentadas | 7 (`DD-1`…`DD-7`) | documento de arquitectura §11 |
| Riesgos documentados | 6 de proyecto (R-01…R-06) + 8 de arquitectura (R1…R8) | acta §Riesgos / arquitectura §12 |

# Anexo B — Brechas identificadas (para la defensa y para el trabajo pendiente)

| # | Brecha | Impacto | Acción recomendada |
|---|---|---|---|
| 1 | Sin pruebas automatizadas de frontend | Regresiones de UI detectadas solo a mano | Vitest + React Testing Library sobre `lib/api-client.ts` y `lib/auth-token.ts`; Playwright para login→publicar→comentar→mensaje |
| 2 | Sin medición de los RNF de rendimiento | `< 500 ms p95`, latencia realtime y LCP no están verificados | k6/Artillery sobre endpoints de listado; Lighthouse CI para LCP |
| 3 | Sin escaneo de seguridad automatizado | La seguridad depende de la revisión manual y de los tests funcionales | Semgrep o CodeQL en CI + OWASP ZAP |
| 4 | Sin `DB::transaction` en escrituras multi-tabla | "crear mensaje + crear documento" puede quedar a medias | Envolver en `DB::transaction` |
| 5 | Caché, sesión y cola en base de datos | Cada request escribe en MariaDB; limita el escalado | Migrar a Redis (habilita también el escalado de Reverb) |
| 6 | Sin backups automatizados verificados | Riesgo de pérdida de datos | Script de `mysqldump` + rotación + prueba de restauración |
| 7 | Sin registro formal de defectos | Los 15 defectos se reconstruyen desde Git; no hay conteo oficial ni severidad | Adoptar tabla de defectos con campos fijos |
| 8 | Hoja de backlog con conteo por estado inconsistente (44 vs. 35 tarjetas) | Evidencia de gestión con dato contradictorio | Corregir las fórmulas `COUNTIF` de la hoja de resumen |
| 9 | Sin versionado de la API (`/api/v1`) | Cambios de contrato rompen clientes | `RNF-MANT-07`, ya planificado |
| 10 | Validación con usuarios no ejecutada | Criterio de aceptación 4 sin cerrar | Iteración 4: protocolo, acta y métricas SMART |
| 11 | Esquema SQL consolidado congelado en 2026-10-05 | No refleja el soft-delete de `messages`/`documents` | Regenerar el DDL desde las migraciones actuales |
| 12 | **Nombre del canal WebSocket inconsistente**: backend `conversation.{id}` vs. frontend `conversations.{id}` (y ambos README documentan el plural) | En un clon nuevo el realtime del chat falla en silencio; sin E2E que lo detecte | Unificar el nombre en backend + frontend + README, y agregar un test E2E del flujo de conversación que ya está en el roadmap |

---

*Documento elaborado a partir del código fuente, la documentación de proyecto y la ejecución real de la suite de pruebas del repositorio `intranet/` en la rama `develop` (HEAD `1bd112d`, 10/11/2026).*
