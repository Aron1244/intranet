# Arquitectura Coherev

> Documento técnico que describe los componentes del sistema, sus responsabilidades, las capas internas del backend, los flujos críticos (autenticación y realtime) y las decisiones de seguridad. Sirve como base para nuevas incorporaciones al equipo y para responder la observación 7 de la profesora Cindy.

---

## 1. Visión general

Coherev es una intranet corporativa estructurada como dos aplicaciones independientes que conviven en un mismo repositorio monorepo. El frontend consume la API REST del backend mediante un cliente HTTP único y mantiene, en paralelo, una conexión WebSocket para recibir eventos en tiempo real. El backend expone la API, gestiona autenticación y autorización, persiste la información en una base de datos relacional y emite los eventos que el frontend escucha.

El sistema se compone de cinco bloques principales: el cliente web en Next.js, el servidor de aplicación en Laravel, la capa de autenticación con Sanctum, el servidor de tiempo real con Laravel Reverb y la base de datos MariaDB. Estos bloques se describen en detalle en las siguientes secciones.

---

## 2. Componentes del sistema

### 2.1 Frontend — Next.js 16 (App Router)

Aplicación web renderizada con React 19 y TypeScript, organizada con el sistema de rutas App Router. Las rutas se agrupan bajo el directorio `app/` con un grupo `dashboard/*` por dominio funcional (conversations, documents, publications, departments, users, roles).

La capa de servicios reside en `lib/` y abstrae las integraciones externas. Hay tres servicios centrales: `api-client.ts` que centraliza headers, manejo de errores y respuesta automática a 401 mediante logout, `auth-token.ts` que gestiona el almacenamiento del token Bearer en `localStorage` o `sessionStorage` según la preferencia de mantener sesión, y `echo-client.ts` que inicializa Laravel Echo con Reverb o Pusher según la configuración del entorno.

Los componentes reutilizables viven en `components/`. El más relevante es `dashboard-sidebar.tsx`, que muestra la navegación según el rol del usuario autenticado e integra un tour de onboarding con driver.js. La capa de UI se estiliza con Tailwind CSS v4 mediante tokens semánticos (`brand-primary`, `brand-accent`, `brand-secondary`, `brand-ligth`, `brand-border`).

### 2.2 Backend — Laravel 13

Servidor de aplicación escrito en PHP 8.5 que expone una API REST bajo el prefijo `/api`. Sigue el patrón MVC clásico de Laravel con capas bien delimitadas y responsabilidades únicas.

Las rutas se definen en `routes/api.php` y se organizan en grupos por recurso (`apiResource` para CRUD estándar) y por dominio funcional. Todas las rutas autenticadas usan el middleware `auth:sanctum`, y un subconjunto restringido aplica el middleware `admin` para operaciones sensibles.

Los controladores viven en `app/Http/Controllers/Api` y orquestan tres responsabilidades: recibir la petición HTTP, delegar la validación a una Form Request específica, y devolver la respuesta formateada con un API Resource cuando corresponde. No contienen lógica de negocio.

Las Form Requests viven en `app/Http/Requests` y encapsulan las reglas de validación por endpoint. Cada Form Request define los campos requeridos, sus reglas (tipo, tamaño, unicidad, existencia en otra tabla) y mensajes de error personalizados.

Los API Resources viven en `app/Http/Resources` y definen la forma serializada de los modelos en las respuestas JSON, controlando qué atributos se exponen y cuáles se ocultan.

### 2.3 Capa de autenticación — Laravel Sanctum v4

Sanctum gestiona la autenticación mediante Personal Access Tokens (PAT). Los tokens se almacenan en la tabla `personal_access_tokens` con su hash, nombre del dispositivo, abilities y fechas de uso.

El flujo de emisión de tokens ocurre en el endpoint `POST /api/login`, que valida credenciales, verifica el hash de la contraseña con bcrypt y crea un nuevo token asociado al dispositivo del cliente (por defecto, `nextjs-client`). El token se devuelve en formato plano una sola vez; el backend retiene únicamente su hash.

Los tokens se envían en cada petición autenticada mediante el header `Authorization: Bearer {token}`. El middleware `auth:sanctum` valida el token contra la tabla y, si existe y no está expirado, inyecta al usuario en la request como `auth()->user()` o `$request->user()`. La revocación de tokens ocurre en `POST /api/logout`, que elimina el token actual del dispositivo.

### 2.4 Capa de tiempo real — Laravel Reverb

Reverb es el servidor WebSocket integrado en Laravel que permite emitir eventos a canales privados desde el backend y consumirlos desde el frontend mediante Laravel Echo. Su función en Coherev es entregar mensajes de chat en tiempo real sin necesidad de polling.

El backend define eventos en `app/Events` (actualmente `MessageSent.php`) que implementan `ShouldBroadcast`. Cada evento declara el canal privado al que se transmite (`conversation.{conversationId}`) y los datos públicos del mensaje. La autorización de acceso al canal se define en `routes/channels.php`, donde se valida que el usuario autenticado sea participante de la conversación.

La emisión del evento ocurre automáticamente cuando un controlador ejecuta `broadcast(new MessageSent($message))->toOthers()`. El servidor Reverb recibe el evento, identifica los suscriptores del canal y entrega el payload a cada uno.

El frontend inicializa Echo en `lib/echo-client.ts` con las credenciales de Reverb (host, puerto, app key) y se suscribe a los canales privados de cada conversación activa del usuario. Cada mensaje entrante actualiza el estado local del chat, marca la conversación como leída si está activa, o incrementa el contador de no leídos si no lo está. Adicionalmente, un `BroadcastChannel` del navegador sincroniza el estado entre múltiples pestañas del mismo usuario.

### 2.5 Persistencia — MariaDB (compatible MySQL)

Base de datos relacional que almacena todas las entidades del sistema. El acceso se realiza exclusivamente mediante Eloquent ORM, lo que previene inyecciones SQL y permite eager loading para evitar problemas N+1.

Las migraciones definen el esquema completo: `users`, `roles`, `user_roles`, `departments`, `department_folders`, `documents`, `conversations`, `conversation_user`, `messages`, `message_reads`, `announcements`, `announcement_attachments`, `comments`, `personal_access_tokens` y las tablas auxiliares de Laravel (`cache`, `jobs`, `sessions`).

Los modelos en `app/Models` definen las relaciones Eloquent con tipos de retorno explícitos: `User` pertenece a un `Department` y pertenece a muchos `Role` y `Conversation`; `Conversation` tiene muchos `User` y muchos `Message`; `Message` pertenece a una `Conversation`, a un `User` (sender) y opcionalmente a un `Document`; `Announcement` pertenece a un `Department` y a un `User` (creator), y tiene muchos `Comment` y `AnnouncementAttachment`.

El almacenamiento de archivos se hace en el disco `public` configurado por Laravel. Los archivos se organizan por carpeta funcional: `announcements/{id}/`, `documents/department/{departmentId}/{folderId}/`, `documents/chat/{conversationId}/`.

---

## 3. Capas internas del backend

### 3.1 Capa HTTP

Responsable de recibir y responder peticiones. Su código vive en `app/Http/Controllers/Api`, `app/Http/Requests` y `app/Http/Resources`. No contiene lógica de negocio: delega validación a Form Requests y composición de respuesta a API Resources. Devuelve códigos HTTP semánticos: 200 para éxito, 201 para creación, 204 para eliminación sin contenido, 401 para no autenticado, 403 para no autorizado, 422 para validación fallida, 404 para recurso inexistente, 500 para error interno.

### 3.2 Capa de dominio

Define las entidades de negocio como modelos Eloquent con relaciones tipadas (`BelongsTo`, `BelongsToMany`, `HasMany`). Contiene los métodos de dominio que encapsulan reglas del negocio, por ejemplo `User::canManageAnnouncements()` que verifica si el usuario pertenece a un rol con permisos para publicar. Esta capa no conoce HTTP ni la base de datos más allá de la persistencia que gestiona Eloquent.

### 3.3 Capa de persistencia

Las migraciones en `database/migrations` definen la estructura relacional completa. Los seeders (`database/seeders`) crean datos iniciales: el `DatabaseSeeder` genera el usuario de prueba y, mediante seeder de roles, los cuatro roles del sistema (Administrador, Líder, Colaborador, Nuevo Ingreso) cuando la Iteración 1 los modele formalmente.

### 3.4 Capa de autorización

Implementa la separación entre autenticación (saber quién es el usuario) y autorización (saber qué puede hacer). La autorización se aplica mediante dos mecanismos complementarios: middleware declarativo en rutas (`auth:sanctum`, `admin`) y Policies declarativas en `app/Policies` que verifican permisos a nivel de modelo. La Policy actual más relevante es `AnnouncementPolicy`, que evalúa si un usuario puede ver, crear, actualizar, eliminar o comentar un anuncio según su rol, su departamento y la visibilidad del anuncio.

### 3.5 Capa de tiempo real

Define los eventos que el backend puede emitir en `app/Events` y autoriza el acceso a canales en `routes/channels.php`. Los eventos que implementan `ShouldBroadcast` se transmiten automáticamente al servidor Reverb cuando el código llama a `broadcast(new Event($data))`. La autorización de canales se ejecuta antes de que el frontend pueda suscribirse: si falla, la suscripción se rechaza sin que el cliente reciba información sobre la existencia del canal.

---

## 4. Flujo de autenticación

El flujo completo de login y autenticación de peticiones sigue estos pasos:

Paso 1 — El usuario abre la aplicación por primera vez. El frontend redirige a la pantalla de login (`app/page.tsx`), que muestra el formulario con los campos de correo corporativo, contraseña y la casilla para mantener la sesión iniciada.

Paso 2 — El usuario envía el formulario. El frontend llama a `POST /api/login` con el cuerpo JSON `{ email, password, device_name }`. El `LoginRequest` valida que el email sea un correo válido, que la contraseña sea string no vacía y que el `device_name` sea string opcional.

Paso 3 — El backend (`AuthController::login`) busca al usuario por email. Si no existe o la contraseña no coincide con el hash bcrypt, devuelve 422 con mensaje genérico para no filtrar la existencia del usuario.

Paso 4 — Si las credenciales son válidas, el backend carga los roles del usuario, calcula el flag `can_manage_announcements` y crea un nuevo token Sanctum para el dispositivo (`nextjs-client`). El token se devuelve en la respuesta junto con los datos del usuario en formato JSON.

Paso 5 — El frontend guarda el token. Si el usuario marcó "mantener sesión iniciada", lo almacena en `localStorage`; si no, lo almacena en `sessionStorage`. Esta elección la gestiona `lib/auth-token.ts`.

Paso 6 — El frontend redirige al dashboard y llama a `GET /api/me` para validar la sesión. Este endpoint devuelve los datos del usuario autenticado más sus roles y permisos, lo que permite al sidebar mostrar las opciones según rol.

Paso 7 — En cada petición posterior a endpoints protegidos, el `api-client.ts` añade automáticamente el header `Authorization: Bearer {token}`. Si el backend responde 401, el cliente limpia el token y redirige al login.

Paso 8 — Al cerrar sesión, el frontend llama a `POST /api/logout`. El backend elimina el token actual de la tabla `personal_access_tokens` y devuelve 200 con mensaje de éxito. El frontend limpia el almacenamiento local y redirige al login.

Para el rate-limit, la Iteración 1 agregará un middleware `throttle:5,1` sobre la ruta de login que limita a cinco intentos por minuto desde la misma IP y email. Al superar el límite, el backend responde 429 con mensaje claro.

---

## 5. Flujo de tiempo real (chat)

El flujo de envío y recepción de mensajes de chat sigue estos pasos:

Paso 1 — El usuario abre la vista de conversaciones. El frontend llama a `GET /api/conversations` para listar las conversaciones en las que participa. Cada conversación incluye el nombre, el tipo (privada o grupo) y los usuarios participantes.

Paso 2 — El usuario selecciona una conversación. El frontend llama a `GET /api/conversations/{id}/messages` para cargar el historial. El backend verifica que el usuario sea participante de la conversación; si no lo es, devuelve 403.

Paso 3 — Tras cargar el historial, el frontend se suscribe al canal privado de WebSocket `conversation.{conversationId}` mediante Laravel Echo. La suscripción pasa por la autorización definida en `routes/channels.php`, que verifica nuevamente que el usuario sea participante.

Paso 4 — El usuario escribe un mensaje y presiona Enter o el botón de enviar. El frontend construye un `FormData` con el `conversation_id`, el contenido textual y, opcionalmente, el archivo adjunto (máximo 20 MB). Llama a `POST /api/messages`.

Paso 5 — El backend (`MessageController::store`) valida los datos, verifica que el usuario sea participante, y si hay archivo adjunto, lo guarda en `documents/chat/{conversationId}/` y crea un registro en `documents` con visibilidad privada. Luego crea el mensaje, lo asocia al documento si corresponde, y ejecuta `broadcast(new MessageSent($message))->toOthers()`.

Paso 6 — El servidor Reverb recibe el evento y lo entrega a todos los suscriptores del canal que no sean el emisor (por el `toOthers()`). Los demás clientes conectados a esa conversación reciben el evento `MessageSent` con los datos del mensaje.

Paso 7 — En el frontend, el listener del canal agrega el mensaje al estado local de la conversación, incrementando el contador de no leídos si la conversación no está activa, o mostrando una notificación visual si está activa en segundo plano. Si la conversación está visible y el usuario está cerca del final del scroll, el autoscroll lleva al último mensaje.

Paso 8 — Adicionalmente, el frontend usa `BroadcastChannel` del navegador para sincronizar el estado entre pestañas del mismo usuario. Si el usuario tiene Coherev abierto en dos pestañas y envía un mensaje en una, la otra pestaña lo recibe instantáneamente sin esperar al WebSocket.

Para mensajes no leídos, la Iteración 2 conectará la tabla `message_reads` al contador. Actualmente el contador se gestiona en `sessionStorage` del cliente; tras la Iteración 2 provendrá del backend, lo que permitirá persistencia entre dispositivos.

---

## 6. Seguridad

La seguridad se aplica en cinco capas:

Capa 1 — Autenticación. Tokens Sanctum con hash bcrypt en la base de datos, transmisión siempre sobre HTTPS en producción y header `Authorization: Bearer` en cada petición. La contraseña del usuario nunca se devuelve en ninguna respuesta.

Capa 2 — Autorización. Middleware `auth:sanctum` en todas las rutas protegidas, middleware `admin` en rutas restringidas y Policies declarativas para autorización a nivel de modelo (por ejemplo, `AnnouncementPolicy::comment` verifica que el anuncio sea visible y pertenezca al departamento del usuario).

Capa 3 — Validación de datos. Form Requests validan tipo, formato, tamaño y unicidad de cada campo antes de llegar al modelo. Esto previene inyección SQL, XSS y datos corruptos. Los errores se devuelven en 422 con estructura `{ message, errors: { campo: [mensajes] } }` que el frontend puede mapear campo por campo.

Capa 4 — Validación de archivos. En la Iteración 1 se agregará validación de MIME real (no solo extensión) a todos los endpoints de subida (`POST /api/messages`, `POST /api/announcements`, `POST /api/departments/{id}/folders/{folderId}/documents`). Los archivos se almacenan en disco `public` con nombres derivados del ID del recurso padre para evitar enumeración.

Capa 5 — Rate limiting. En la Iteración 1 se agregará throttle al endpoint de login (5 intentos por minuto por IP y email). Se considera agregar también throttle a endpoints de escritura sensibles (creación de usuarios, departamentos, publicaciones) en iteraciones posteriores.

---

## 7. Stack resumen

| Componente | Tecnología | Versión | Responsabilidad |
|---|---|---|---|
| Frontend | Next.js | 16 | UI con App Router |
| Frontend | React | 19 | Componentes |
| Frontend | TypeScript | 5.x | Tipado estático |
| Frontend | Tailwind CSS | 4 | Estilos utility-first |
| Backend | Laravel | 13 | Framework PHP |
| Backend | PHP | 8.5 | Lenguaje |
| Backend | Laravel Sanctum | 4 | Autenticación con PAT |
| Backend | Laravel Reverb | 1 | Servidor WebSocket |
| BD | MariaDB | 10.x | Persistencia relacional (compatible MySQL) |
| BD | Beekeeper Studio | – | Administración local |
| Realtime cliente | Laravel Echo | – | Suscripción a canales |
| Despliegue local | Laravel Herd | – | Entorno de desarrollo |

---

## 8. Decisiones de diseño registradas

Decisión 1 — Sanctum PAT sobre Sanctum SPA. Se eligió tokens Personales porque el frontend no comparte cookies con el backend (son aplicaciones separadas en puertos distintos), lo que descarta Sanctum SPA. Los tokens se revocan individualmente por dispositivo.

Decisión 2 — Reverb sobre Pusher como servidor principal. Se eligió Reverb porque es la solución oficial de Laravel y no tiene costo. Pusher queda configurado como fallback para entornos donde Reverb no esté disponible.

Decisión 3 — MariaDB sobre MySQL puro. MariaDB es compatible con MySQL a nivel de API y drivers, pero ofrece mejor rendimiento en operaciones de lectura y es la opción por defecto en Herd. La conexión se configura con `DB_CONNECTION=mariadb` en el archivo `.env`.

Decisión 4 — BroadcastChannel para sincronía entre pestañas. Se agregó un `BroadcastChannel` del navegador para que múltiples pestañas del mismo usuario reciban los mensajes nuevos sin pasar por el WebSocket, lo que reduce latencia y simplifica el manejo de estado local.

Decisión 5 — Sesión por sesión. Se optó por guardar el token en `localStorage` solo si el usuario marca "mantener sesión iniciada"; en caso contrario se guarda en `sessionStorage` para limitar la persistencia al cierre de pestaña.

---

## 9. Referencias cruzadas

- Backlog de tarjetas: [`BACKLOG.md`](./BACKLOG.md) — ver tarjetas `DOC-001` (este documento), `SEC-*` (seguridad), `ROL-*` (roles), `BRAND-002` (tokens de marca).
- Roadmap de iteraciones: [`ROADMAP.md`](./ROADMAP.md) — Iteración 1 implementa la mayoría de las medidas de seguridad descritas.
- API REST documentada: `backend/API_NEXTJS.md` y `frontend/API_NEXTJS.md`.
- Modelo entidad-relación: [`DATABASE.md`](./DATABASE.md).
- Trazabilidad problema-requisito-historia-prueba: [`TRACEABILITY.md`](./TRACEABILITY.md).
