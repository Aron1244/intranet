# Documento de Arquitectura de Software

**Proyecto:** Coherev — Intranet corporativa para la gestión y comunicación interna

**Versión del documento:** 1.0

**Fecha:** Septiembre 2026

**Asignatura:** Capstone - 003D

**Docente:** Cindy Betzabé Contador Cisterna

**Integrantes:**
- Benjamín Herrera
- Julián Tapia

**Institución:** Duoc UC — Escuela de Informática y Telecomunicaciones

---

## Índice

1. Introducción
2. Representación arquitectónica
3. Objetivos y restricciones arquitectónicas
4. Vista de casos de uso
5. Vista lógica
6. Vista de desarrollo
7. Vista de despliegue
8. Vista de datos
9. Atributos de calidad
10. Flujos críticos
11. Decisiones de diseño
12. Riesgos y mitigaciones
13. Conclusiones
14. Referencias bibliográficas
15. Anexos

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento describe la arquitectura de software del proyecto Coherev, una intranet corporativa desarrollada para centralizar la comunicación, la gestión documental y la coordinación de tareas del equipo distribuido de la empresa cliente. Su propósito es servir como referencia técnica para el equipo de desarrollo, facilitar la incorporación de nuevos integrantes, respaldar la sustentación académica del proyecto y responder la observación número 7 emitida por la docente Cindy Betzabé Contador Cisterna respecto a la necesidad de incluir un diagrama de arquitectura en la presentación final.

El documento está dirigido a tres audiencias principales: los integrantes del equipo de desarrollo, quienes necesitan entender las decisiones tomadas y la organización del código; el cuerpo docente de la asignatura Capstone, quien evalúa la coherencia técnica del proyecto; y eventuales mantenedores futuros del sistema, quienes requerirán una guía de alto nivel para extender o modificar la plataforma.

### 1.2 Alcance

El documento cubre la arquitectura del producto Coherev en su estado actual y en su roadmap planificado al cierre de la Iteración 5 del proyecto. Quedan fuera del alcance los detalles de implementación de bajo nivel (algoritmos internos de los controladores, formato exacto de payloads JSON, estilos CSS individuales), los cuales se describen en los archivos de código fuente y en los manuales de API. Tampoco se cubren aspectos de infraestructura de producción (configuración de nginx, certificados SSL, balanceadores de carga), dado que el proyecto se ejecuta actualmente en entorno de desarrollo local.

### 1.3 Definiciones, acrónimos y abreviaciones

| Término | Definición |
|---|---|
| API | Application Programming Interface |
| App Router | Sistema de ruteo de Next.js basado en convención de carpetas |
| CRUD | Create, Read, Update, Delete |
| Eloquent | ORM nativo de Laravel |
| Eager loading | Técnica para cargar relaciones en una sola consulta |
| Form Request | Clase de Laravel para validar peticiones HTTP |
| JWT | JSON Web Token (no se usa en este proyecto, se incluye por referencia) |
| ORM | Object-Relational Mapping |
| PAT | Personal Access Token (Sanctum) |
| Policy | Clase de Laravel que autoriza acciones sobre un modelo |
| Reverb | Servidor WebSocket oficial de Laravel |
| Sanctum | Paquete oficial de Laravel para autenticación por tokens |
| SPA | Single Page Application (descartado en este proyecto) |
| WebSocket | Protocolo de comunicación bidireccional sobre TCP |
| XSS | Cross-Site Scripting |

### 1.4 Referencias

- Laravel 13 — Documentación oficial. https://laravel.com/docs
- Next.js 16 — Documentación oficial. https://nextjs.org/docs
- Laravel Sanctum — Documentación oficial. https://laravel.com/docs/sanctum
- Laravel Reverb — Documentación oficial. https://laravel.com/docs/reverb
- MariaDB — Documentación oficial. https://mariadb.com/kb/en/documentation/
- Tailwind CSS v4 — Documentación oficial. https://tailwindcss.com/docs
- Laravel Echo — Documentación oficial. https://laravel.com/docs/broadcasting

Documentos internos del proyecto:
- `BACKLOG.md` — Tarjetas de trabajo y dependencias
- `ROADMAP.md` — Iteraciones planificadas
- `DATABASE.md` — Modelo entidad-relación
- `REQUIREMENTS.md` — Requisitos funcionales y no funcionales
- `USER_STORIES.md` — Historias de usuario
- `TRACEABILITY.md` — Matriz de trazabilidad

### 1.5 Visión general del documento

El documento se organiza siguiendo el estándar de vistas arquitectónicas 4+1 (Philippe Kruchten). Las secciones 2 y 3 presentan la representación de alto nivel y los objetivos. Las secciones 4 a 8 describen las cinco vistas del modelo: casos de uso, lógica, de desarrollo, de despliegue y de datos. Las secciones 9 a 11 cubren atributos de calidad, flujos críticos y decisiones de diseño. Finalmente, las secciones 12 a 15 abordan riesgos, conclusiones, referencias y anexos.

---

## 2. Representación arquitectónica

Coherev se estructura como dos aplicaciones independientes que conviven en un mismo repositorio monorepo. La primera aplicación es el cliente web construido con Next.js, responsable de la interfaz de usuario y de la interacción con el usuario final. La segunda aplicación es el servidor backend construido con Laravel, responsable de la lógica de negocio, la persistencia de datos, la autenticación y la emisión de eventos en tiempo real. Ambas aplicaciones se comunican mediante dos canales paralelos: una API REST sobre HTTPS para las operaciones síncronas y una conexión WebSocket sobre Laravel Reverb para los eventos asíncronos.

El sistema completo se compone de cinco bloques técnicos: el frontend en Next.js, el backend en Laravel, la capa de autenticación implementada con Sanctum, la capa de tiempo real implementada con Reverb, y la base de datos relacional MariaDB. Cada bloque tiene responsabilidades bien delimitadas y se comunica con los demás mediante interfaces definidas.

### 2.1 Cliente web — Next.js 16

Aplicación de página única renderizada con React 19 y TypeScript, organizada mediante el sistema de rutas App Router de Next.js. Las rutas se agrupan bajo el directorio `app/` con un grupo `dashboard/*` que contiene las vistas autenticadas, separadas por dominio funcional: conversaciones, documentos, publicaciones, departamentos, usuarios y roles. La ruta raíz `app/page.tsx` corresponde a la pantalla de login.

La capa de servicios reside en `lib/` y abstrae las tres integraciones externas principales. El archivo `api-client.ts` implementa un cliente HTTP único que centraliza los headers de las peticiones, el manejo de errores estandarizado y la respuesta automática al código 401 mediante logout. El archivo `auth-token.ts` gestiona el almacenamiento del token Bearer en `localStorage` o `sessionStorage` según la preferencia del usuario de mantener la sesión iniciada. El archivo `echo-client.ts` inicializa Laravel Echo con las credenciales de Reverb o Pusher según la configuración del entorno.

Los componentes reutilizables viven en el directorio `components/`. El más relevante es `dashboard-sidebar.tsx`, que muestra la navegación adaptada al rol del usuario autenticado e integra un tour de onboarding con la biblioteca driver.js. La capa de presentación se estiliza con Tailwind CSS versión 4 mediante tokens semánticos referidos a la marca Coherev (`brand-primary`, `brand-accent`, `brand-secondary`, `brand-ligth`, `brand-border`).

### 2.2 Servidor backend — Laravel 13

Servidor de aplicación escrito en PHP 8.5 que expone una API REST bajo el prefijo `/api`. Sigue el patrón Modelo-Vista-Controlador clásico de Laravel extendido con capas de validación, autorización y tiempo real. Toda la lógica de negocio se organiza en cinco capas internas: HTTP, dominio, persistencia, autorización y tiempo real, cada una con responsabilidades únicas.

Las rutas se definen en `routes/api.php` y se organizan en grupos por recurso, utilizando el helper `apiResource` para CRUD estándar y rutas explícitas para operaciones especiales como descarga de archivos o emisión de eventos. Todas las rutas autenticadas pasan por el middleware `auth:sanctum`, y un subconjunto restringido aplica además el middleware `admin` para operaciones sensibles.

Los controladores viven en `app/Http/Controllers/Api` y cumplen tres responsabilidades: recibir la petición HTTP, delegar la validación a una Form Request específica, y devolver la respuesta formateada con un API Resource cuando corresponde. Los controladores no contienen lógica de negocio.

Las Form Requests viven en `app/Http/Requests` y encapsulan las reglas de validación por endpoint. Cada Form Request declara los campos requeridos, sus reglas de tipo, tamaño, unicidad y existencia referencial, y los mensajes de error personalizados.

Los API Resources viven en `app/Http/Resources` y controlan la forma serializada de los modelos en las respuestas JSON, determinando qué atributos se exponen al cliente y cuáles se ocultan.

### 2.3 Capa de autenticación — Laravel Sanctum v4

Sanctum gestiona la autenticación mediante Personal Access Tokens. Los tokens se almacenan en la tabla `personal_access_tokens` con su hash SHA-256, el nombre del dispositivo que los solicitó, los abilities asociados y las marcas de tiempo de creación y último uso.

El endpoint `POST /api/login` valida las credenciales del usuario, verifica que la contraseña proporcionada coincida con el hash bcrypt almacenado y crea un nuevo token Sanctum asociado al dispositivo cliente. Por defecto el dispositivo se identifica como `nextjs-client`. El token se devuelve al cliente una sola vez en formato plano; el backend retiene únicamente su hash, de modo que ningún agente (incluido un atacante con acceso a la base de datos) puede recuperar el token original.

Los tokens se transmiten en cada petición autenticada mediante el header HTTP `Authorization: Bearer {token}`. El middleware `auth:sanctum` valida el token contra la tabla, y si existe y no está expirado, inyecta al usuario en la petición como `auth()->user()` o `$request->user()`. La revocación se ejecuta en `POST /api/logout`, que elimina el token actual del dispositivo.

La decisión de usar Sanctum PAT en lugar de Sanctum SPA se tomó porque el frontend y el backend son aplicaciones independientes en puertos distintos y no comparten cookies de sesión. Los tokens PAT se revocan individualmente por dispositivo, lo que permite sesiones simultáneas desde múltiples dispositivos para un mismo usuario.

### 2.4 Capa de tiempo real — Laravel Reverb

Reverb es el servidor WebSocket integrado en Laravel que permite emitir eventos a canales privados desde el backend y consumirlos desde el frontend mediante Laravel Echo. Su función en Coherev es entregar mensajes de chat en tiempo real sin necesidad de polling por parte del cliente.

El backend declara eventos en `app/Events/MessageSent.php` que implementan la interfaz `ShouldBroadcast`. Cada evento declara el canal privado al que se transmite y los datos públicos del mensaje. La autorización de acceso al canal se define en `routes/channels.php`, donde una función valida que el usuario autenticado sea participante de la conversación solicitada; si la validación falla, la suscripción se rechaza sin filtrar la existencia del canal.

La emisión del evento ocurre cuando un controlador ejecuta la sentencia `broadcast(new MessageSent($message))->toOthers()`. El método `toOthers()` excluye al emisor del conjunto de destinatarios, evitando que el cliente que envió el mensaje reciba su propio evento por el WebSocket. El servidor Reverb recibe el evento, identifica a los suscriptores del canal y entrega el payload a cada uno mediante la conexión persistente.

El frontend inicializa Echo en `lib/echo-client.ts` con las credenciales de Reverb (host, puerto y app key obtenidas del archivo `.env`) y se suscribe a los canales privados de cada conversación activa del usuario. Cada mensaje entrante actualiza el estado local del chat: si la conversación está activa, marca como leída y muestra una notificación visual; si no lo está, incrementa el contador de no leídos. Adicionalmente, un `BroadcastChannel` del navegador sincroniza el estado entre múltiples pestañas del mismo usuario.

### 2.5 Persistencia — MariaDB 10.x

Base de datos relacional compatible con MySQL que almacena todas las entidades del sistema. El acceso se realiza exclusivamente mediante Eloquent ORM, lo que previene inyecciones SQL y habilita el eager loading para evitar problemas de N+1 en consultas con relaciones.

El esquema relacional se compone de las siguientes tablas principales: `users` (identidad), `roles` y `user_roles` (modelo de permisos muchos a muchos), `departments` (organización) y `department_folders` (jerarquía documental), `documents` (archivos físicos), `conversations` y `conversation_user` (chat), `messages` y `message_reads` (mensajería y auditoría de lectura), `announcements`, `announcement_attachments` y `comments` (publicaciones), y `personal_access_tokens` (tokens Sanctum). Se incluyen además las tablas auxiliares de Laravel: `cache`, `jobs` y `sessions`.

Los modelos Eloquent en `app/Models` declaran las relaciones con tipos de retorno explícitos. La entidad `User` pertenece a un `Department` y pertenece a muchos `Role` y `Conversation`. La entidad `Conversation` tiene muchos `User` y muchos `Message`. La entidad `Message` pertenece a una `Conversation`, a un `User` como emisor y opcionalmente a un `Document` adjunto. La entidad `Announcement` pertenece a un `Department` y a un `User` como creador, y tiene muchos `Comment` y `AnnouncementAttachment`.

El almacenamiento de archivos se realiza en el disco `public` configurado por Laravel. Los archivos se organizan por carpeta funcional según el recurso padre: `announcements/{id}/` para adjuntos de publicaciones, `documents/department/{departmentId}/{folderId}/` para archivos del módulo de documentos, y `documents/chat/{conversationId}/` para adjuntos del chat.

---

## 3. Objetivos y restricciones arquitectónicas

### 3.1 Objetivos arquitectónicos

**OA1 — Separación clara de responsabilidades.** Cada capa del backend cumple una única responsabilidad: HTTP recibe y responde, Dominio contiene reglas de negocio, Persistencia gestiona el esquema relacional, Autorización aplica permisos, Tiempo real emite eventos.

**OA2 — Seguridad por defecto.** Ningún endpoint queda accesible sin autorización correcta. Toda escritura pasa por Form Request con validación de tipo, formato, tamaño y unicidad. Los tokens Sanctum se almacenan hasheados y se transmiten siempre sobre HTTPS en producción.

**OA3 — Trazabilidad extremo a extremo.** Cada funcionalidad implementada puede rastrearse hasta un requisito funcional, una historia de usuario, una tarjeta del backlog y un caso de prueba automatizado. La matriz de trazabilidad se documenta en `TRACEABILITY.md`.

**OA4 — Tiempo real sin polling.** El chat y las notificaciones de mensajes nuevos se entregan mediante WebSockets con Reverb, evitando consultas periódicas al backend que degraden el rendimiento y la experiencia de usuario.

**OA5 — Reutilización de componentes.** El cliente HTTP es único en el frontend (`api-client.ts`), el sidebar es único para todas las vistas autenticadas (`dashboard-sidebar.tsx`), y los modelos Eloquent son únicos en el backend. No se duplica lógica transversal.

### 3.2 Restricciones arquitectónicas

**RA1 — Stack tecnológico fijo.** El proyecto utiliza Laravel 13, Next.js 16, MariaDB 10.x, Laravel Sanctum v4, Laravel Reverb v1, Tailwind CSS v4 y TypeScript 5.x. No se introducen frameworks adicionales sin aprobación.

**RA2 — Compatibilidad con MySQL.** Aunque la base de datos es MariaDB, todas las consultas, migraciones y tipos de columna deben ser compatibles con MySQL 8 para permitir migrar de motor sin reescribir código.

**RA3 — Entorno de desarrollo local.** El sistema se ejecuta localmente con Laravel Herd, lo que implica HTTP en `localhost:8000` para el backend y `localhost:3000` para el frontend. La configuración de producción queda fuera del alcance del proyecto académico.

**RA4 — Sin estado compartido entre backend y frontend.** El backend no mantiene sesiones en memoria: cada petición es autocontenida mediante el token Bearer. El frontend gestiona su propio estado local mediante React.

**RA5 — Documentación continua.** Todo cambio arquitectónico (nuevo componente, nueva capa, nueva dependencia externa) debe reflejarse en este documento y en `BACKLOG.md` antes de mergearse a la rama principal.

---

## 4. Vista de casos de uso

Los casos de uso del sistema se documentan en detalle en `USER_STORIES.md`. Esta sección presenta únicamente el resumen de los flujos principales que la arquitectura debe soportar.

**CU-1 — Autenticación.** El usuario no autenticado accede a la pantalla de login, ingresa sus credenciales y recibe un token de acceso. El sistema valida credenciales contra la base de datos y emite un token Sanctum con hash bcrypt.

**CU-2 — Publicación de anuncios.** Un usuario con permisos para publicar crea un anuncio con título, contenido, departamento destino y archivos adjuntos opcionales. El sistema valida los datos, almacena el anuncio y los adjuntos, y notifica a los usuarios del departamento mediante el feed del dashboard.

**CU-3 — Mensajería de chat.** Un usuario autenticado selecciona o crea una conversación, envía un mensaje de texto con adjuntos opcionales, y los demás participantes reciben el mensaje en tiempo real mediante WebSocket. El sistema persiste el mensaje y mantiene un contador de no leídos por conversación.

**CU-4 — Gestión documental.** Un usuario navega o busca documentos por departamento, visualiza los metadatos del archivo y descarga el contenido mediante un endpoint protegido por token. El sistema filtra los documentos según la visibilidad (público, departamental o privado) y el rol del usuario.

**CU-5 — Administración de usuarios y roles.** Un administrador crea, edita y elimina usuarios, y les asigna uno o más roles. El sistema valida unicidad del email, aplica el hash bcrypt a la contraseña y mantiene la integridad referencial con la tabla `user_roles`.

**CU-6 — Gestión de departamentos y carpetas.** Un administrador crea departamentos con sus carpetas jerárquicas, y los líderes de área suben documentos a sus carpetas departamentales. El sistema aplica permisos de visibilidad por departamento.

---

## 5. Vista lógica

La vista lógica describe la organización del código en capas y módulos, sin entrar en el detalle de cada clase individual.

### 5.1 Backend en capas

El backend se organiza en cinco capas con flujo unidireccional de dependencias: HTTP depende de Dominio y Autorización; Dominio depende de Persistencia; Persistencia no depende de ninguna otra capa de negocio; Autorización depende de Dominio; Tiempo real depende de Dominio.

**Capa HTTP.** Archivos en `app/Http/Controllers/Api`, `app/Http/Requests`, `app/Http/Resources` y `app/Http/Middleware`. Responsable de recibir peticiones, validarlas, invocar al dominio y devolver respuestas JSON con códigos HTTP semánticos.

**Capa de Dominio.** Archivos en `app/Models`. Contiene las entidades del negocio como modelos Eloquent con relaciones tipadas y métodos que encapsulan reglas del dominio. Ejemplo: `User::canManageAnnouncements()` verifica si el usuario tiene permisos para publicar anuncios según su rol.

**Capa de Persistencia.** Archivos en `database/migrations`, `database/seeders` y `database/factories`. Define el esquema relacional completo y los datos iniciales. Las migraciones son la fuente de verdad del esquema; los seeders se ejecutan para preparar entornos de desarrollo y pruebas.

**Capa de Autorización.** Archivos en `app/Policies` y configuración de middleware en `bootstrap/app.php`. Implementa la separación entre autenticación y autorización. Las Policies verifican permisos a nivel de modelo; los middleware aplican permisos a nivel de ruta.

**Capa de Tiempo Real.** Archivos en `app/Events`, `routes/channels.php` y configuración de broadcasting en `config/broadcasting.php`. Define los eventos que el backend puede emitir y autoriza el acceso a canales WebSocket.

### 5.2 Frontend en capas

El frontend se organiza en tres capas con responsabilidades similares: Rutas, Componentes y Servicios.

**Capa de Rutas.** Directorio `app/` con la convención de App Router. Cada carpeta representa una ruta y contiene un archivo `page.tsx` con el componente de la página. Las rutas autenticadas viven bajo `app/dashboard/*` y comparten el layout que incluye el sidebar.

**Capa de Componentes.** Directorio `components/` con piezas reutilizables. El componente principal es `dashboard-sidebar.tsx`, presente en todas las páginas autenticadas. Componentes específicos de módulo viven junto a sus páginas o en subcarpetas por dominio.

**Capa de Servicios.** Directorio `lib/` con la integración externa. Tres servicios centrales: `api-client.ts`, `auth-token.ts` y `echo-client.ts`. Cualquier nueva integración con el backend debe pasar por un servicio en esta capa; los componentes no llaman directamente a `fetch` ni a `localStorage`.

---

## 6. Vista de desarrollo

La vista de desarrollo describe la estructura de carpetas del repositorio monorepo y la organización del código fuente.

### 6.1 Estructura del repositorio

El repositorio se compone de tres elementos principales: dos aplicaciones independientes (backend y frontend) y un directorio de documentación compartida.

El directorio `backend/` contiene la aplicación Laravel 13 con la estructura estándar del framework: `app/` para código de aplicación, `bootstrap/` para inicialización, `config/` para archivos de configuración, `database/` para migraciones, seeders y factories, `public/` para el punto de entrada HTTP, `resources/` para vistas Blade y assets, `routes/` para definición de rutas, `storage/` para archivos generados, `tests/` para pruebas automatizadas, y archivos de configuración como `composer.json`, `phpunit.xml` y `.env`.

El directorio `frontend/` contiene la aplicación Next.js 16 con su estructura estándar: `app/` para rutas con App Router, `components/` para piezas reutilizables, `lib/` para servicios de integración, `public/` para assets estáticos, y archivos de configuración como `package.json`, `next.config.ts`, `tsconfig.json` y `tailwind.config.*`.

El directorio `docs/` contiene los documentos técnicos y académicos del proyecto: `BACKLOG.md`, `ROADMAP.md`, `ARCHITECTURE.md` (este documento), `DATABASE.md`, `REQUIREMENTS.md`, `USER_STORIES.md`, `TRACEABILITY.md`, y subdirectorios como `evidence/` para actas de pruebas y capturas.

### 6.2 Estructura interna del backend

Dentro de `backend/app/` la organización sigue la convención de Laravel. El subdirectorio `Http/Controllers/Api` contiene los controladores REST, uno por recurso principal (`AuthController`, `UserController`, `RoleController`, `DepartmentController`, `DocumentController`, `AnnouncementController`, `ConversationController`, `MessageController`, `CommentController`). El subdirectorio `Http/Requests` contiene las clases de validación. El subdirectorio `Http/Resources` contiene los serializadores de respuesta. El subdirectorio `Models` contiene las entidades Eloquent. El subdirectorio `Policies` contiene las clases de autorización. El subdirectorio `Events` contiene los eventos de broadcasting.

### 6.3 Estructura interna del frontend

Dentro de `frontend/app/` la organización sigue la convención de App Router. El archivo raíz `page.tsx` corresponde a la pantalla de login. El subdirectorio `dashboard/` agrupa todas las vistas autenticadas: `page.tsx` para el dashboard de inicio, y subdirectorios por dominio (`conversations`, `documents`, `publications`, `departments`, `users`, `roles`).

Dentro de `frontend/components/` reside el sidebar reutilizable y los componentes compartidos. Dentro de `frontend/lib/` residen los tres servicios de integración con el backend.

### 6.4 Estrategia de branching

El repositorio utiliza Git con flujo de ramas por feature. La rama principal es `main` y contiene el código estable. Cada tarjeta del backlog se desarrolla en una rama dedicada con el patrón `feature/{ID}-{descripcion-corta}`, se mergea mediante Pull Request con revisión cruzada entre los dos integrantes, y se squash-mergea a `main` para mantener un historial limpio.

---

## 7. Vista de despliegue

La vista de despliegue describe la topología física y de red del sistema en su entorno de ejecución.

### 7.1 Entorno de desarrollo local

En desarrollo, el sistema se ejecuta en una sola máquina física con dos procesos independientes. El backend Laravel se levanta mediante `php artisan serve` o el entorno Herd, escuchando en `http://localhost:8000`. El frontend Next.js se levanta mediante `pnpm dev`, escuchando en `http://localhost:3000`. La base de datos MariaDB se levanta mediante el servicio incluido en Herd o mediante un contenedor Docker, escuchando en `localhost:3306`. El servidor Reverb se levanta mediante `php artisan reverb:start`, escuchando en `localhost:8080` para las conexiones WebSocket.

El navegador del desarrollador accede al frontend en `localhost:3000`, que internamente consume la API en `localhost:8000` y abre conexiones WebSocket a `localhost:8080`. Las credenciales se intercambian sin CORS porque ambos procesos comparten el origen `localhost` en distintos puertos, lo cual requiere configuración explícita de CORS en el backend.

### 7.2 Entorno de producción (fuera del alcance académico)

En producción, el despliegue seguiría una topología de tres capas: un balanceador de carga frente al frontend Next.js (renderizado con Node.js o exportado a estático), un servidor de aplicación Laravel detrás de un proxy reverso con PHP-FPM, y un servidor de base de datos MariaDB con réplicas de lectura. El servidor Reverb se desplegaría como servicio independiente con balanceador de carga para WebSockets. Los assets estáticos se servirían desde una CDN. Esta topología no se implementa en el marco del proyecto académico, pero queda documentada como referencia para eventuales mantenedores.

---

## 8. Vista de datos

La vista de datos describe el modelo de persistencia del sistema. El detalle completo del esquema relacional, con tipos de columna, claves foráneas y relaciones, se documenta en `DATABASE.md`. Esta sección presenta únicamente el resumen de las entidades principales y sus relaciones.

### 8.1 Entidades principales

La entidad `users` almacena la identidad de cada persona del sistema, con campos para nombre, email único, hash de contraseña, departamento asignado y marcas de tiempo. La entidad `roles` almacena los roles disponibles con su nombre y opcionalmente un flag `can_post_announcements`. La tabla pivote `user_roles` establece la relación muchos a muchos entre usuarios y roles.

La entidad `departments` almacena las áreas de la organización con nombre único y descripción opcional. La entidad `department_folders` permite una jerarquía de carpetas dentro de cada departamento para organizar documentos.

La entidad `documents` almacena los archivos subidos con metadatos (título, nombre original, ruta en disco, MIME type, tamaño), referencia al usuario que lo subió, referencia opcional a la carpeta departmental y un campo de visibilidad (`public`, `department`, `private`).

La entidad `conversations` almacena las salas de chat con un nombre opcional y un tipo (`private` para conversaciones uno a uno, `group` para conversaciones grupales). La tabla pivote `conversation_user` asocia usuarios a conversaciones. La entidad `messages` almacena cada mensaje con su contenido, referencia a la conversación, al emisor y opcionalmente a un documento adjunto.

La entidad `message_reads` registra cuándo un usuario leyó un mensaje específico, lo que permite calcular contadores de no leídos persistentes entre dispositivos.

La entidad `announcements` almacena las publicaciones con título, contenido, departamento destino, visibilidad, autor y marcas de tiempo. La entidad `announcement_attachments` asocia archivos a publicaciones. La entidad `comments` almacena los comentarios de usuarios sobre publicaciones.

La entidad `personal_access_tokens` almacena los tokens Sanctum emitidos, con su hash, nombre del dispositivo, abilities y marcas de tiempo.

### 8.2 Relaciones clave

La relación entre `users` y `departments` es muchos a uno: cada usuario pertenece a un departamento. La relación entre `users` y `roles` es muchos a muchos mediante `user_roles`. La relación entre `users` y `conversations` es muchos a muchos mediante `conversation_user`. La relación entre `conversations` y `messages` es uno a muchos. La relación entre `messages` y `users` (como emisor) es muchos a uno.

La relación entre `departments` y `department_folders` es uno a muchos. La relación entre `department_folders` y `documents` es uno a muchos. La relación entre `departments` y `announcements` es uno a muchos. La relación entre `announcements` y `comments` es uno a muchos. La relación entre `announcements` y `announcement_attachments` es uno a muchos.

---

## 9. Atributos de calidad

### 9.1 Seguridad

La seguridad es el atributo de calidad prioritario del sistema, dado que Coherev maneja autenticación, autorización, datos personales y archivos corporativos. Se aplica en cinco capas descritas en la sección 2 de este documento: autenticación con tokens hasheados, autorización con middleware y Policies, validación con Form Requests, validación de MIME real en archivos (implementada en la Iteración 1) y rate limiting en login (implementado en la Iteración 1).

Adicionalmente, todas las contraseñas se almacenan con hash bcrypt de 12 rounds (configurado en `BCRYPT_ROUNDS=12`), lo que hace computacionalmente inviable un ataque de fuerza bruta sobre la tabla de usuarios. Los tokens Sanctum se almacenan hasheados con SHA-256, por lo que un atacante con acceso a la base de datos no puede recuperar tokens activos.

### 9.2 Rendimiento

El sistema está diseñado para responder en menos de 200 milisegundos en el percentil 95 para operaciones síncronas (objetivo RNF). Las consultas a la base de datos utilizan eager loading para evitar problemas de N+1. Los endpoints de listado implementan paginación cuando el volumen de datos lo justifica. El frontend minimiza re-renders mediante componentes memoizados cuando es relevante.

El tiempo real se entrega mediante WebSockets persistentes, evitando el overhead de polling continuo que degradaría tanto el rendimiento del servidor como la experiencia del usuario.

### 9.3 Disponibilidad

En el entorno de desarrollo, la disponibilidad depende del correcto levantamiento de los tres servicios (backend, frontend, Reverb). En un entorno de producción, la disponibilidad objetivo es igual o superior al 99 % mensual (objetivo RNF), lograble mediante réplicas del servidor de aplicación y del servidor Reverb detrás de balanceadores de carga, más una base de datos con alta disponibilidad.

### 9.4 Mantenibilidad

El código sigue las convenciones de cada framework: PSR-12 en PHP y las guías de estilo de Next.js en TypeScript. El código se formatea automáticamente con Laravel Pint en el backend. Las dependencias se declaran explícitamente en `composer.json` y `package.json`, sin dependencias globales implícitas. La documentación arquitectónica (este documento) y los documentos asociados (`BACKLOG.md`, `ROADMAP.md`, `DATABASE.md`) se mantienen actualizados con cada cambio significativo.

### 9.5 Usabilidad

La interfaz de usuario se diseña según los principios de claridad, consistencia y eficiencia. Se aplica un sistema de tokens semánticos para mantener la coherencia visual. La diferenciación por rol garantiza que cada usuario vea solo las opciones relevantes para su función. El tour de onboarding con driver.js facilita la primera experiencia de uso. La Iteración 5 del proyecto incorpora ajustes de accesibilidad WCAG nivel AA y diseño responsive para dispositivos móviles.

---

## 10. Flujos críticos

### 10.1 Flujo de autenticación

El flujo completo de autenticación se ejecuta en los siguientes pasos.

Paso 1. El usuario accede a la aplicación por primera vez. El frontend detecta la ausencia de token y redirige a la pantalla de login (`app/page.tsx`), que muestra el formulario con los campos de correo corporativo, contraseña y la casilla para mantener la sesión iniciada.

Paso 2. El usuario completa el formulario y lo envía. El frontend llama a `POST /api/login` con el cuerpo JSON que contiene email, password y device_name. La Form Request `LoginRequest` valida que el email tenga formato válido, que la contraseña sea string no vacío y que el device_name sea string opcional con máximo 255 caracteres.

Paso 3. El backend procesa la petición en `AuthController::login`. Busca al usuario por email y verifica que la contraseña proporcionada coincida con el hash bcrypt almacenado. Si la validación falla, devuelve código 422 con mensaje genérico para no filtrar la existencia del usuario.

Paso 4. Si las credenciales son válidas, el backend carga los roles del usuario, calcula el flag `can_manage_announcements` invocando al método de dominio `User::canManageAnnouncements()`, y crea un nuevo token Sanctum mediante `$user->createToken($deviceName)`. El token plano se devuelve al cliente junto con los datos del usuario en formato JSON.

Paso 5. El frontend guarda el token. Si el usuario marcó la casilla de mantener sesión iniciada, el token se almacena en `localStorage`; en caso contrario se almacena en `sessionStorage`. Esta decisión la gestiona `lib/auth-token.ts` mediante la función `saveAccessToken(token, remember)`.

Paso 6. El frontend redirige al usuario al dashboard y ejecuta una llamada a `GET /api/me` para validar la sesión y obtener los datos actualizados del usuario. El endpoint devuelve el usuario con sus roles y el flag `can_manage_announcements`.

Paso 7. En cada petición posterior a endpoints protegidos, el servicio `api-client.ts` añade automáticamente el header `Authorization: Bearer {token}`. Si el backend responde con código 401, el cliente limpia el token del almacenamiento local y redirige al login.

Paso 8. Cuando el usuario cierra sesión, el frontend llama a `POST /api/logout`. El backend elimina el token actual de la tabla `personal_access_tokens` mediante `$request->user()->currentAccessToken()->delete()` y responde con código 200 y mensaje de éxito. El frontend limpia el almacenamiento y redirige al login.

Como mejora planificada para la Iteración 1, se agregará un middleware `throttle:5,1` sobre la ruta de login para limitar a cinco intentos por minuto desde la misma combinación de IP y email, con respuesta 429 al superar el límite.

### 10.2 Flujo de tiempo real (chat)

El flujo completo de envío y recepción de mensajes de chat se ejecuta en los siguientes pasos.

Paso 1. El usuario autenticado abre la vista de conversaciones. El frontend ejecuta `GET /api/conversations` para obtener el listado de conversaciones en las que participa. La respuesta incluye el nombre, el tipo y los usuarios participantes de cada conversación.

Paso 2. El usuario selecciona una conversación de la lista. El frontend ejecuta `GET /api/conversations/{id}/messages` para cargar el historial. El backend verifica que el usuario sea participante de la conversación; si no lo es, devuelve código 403.

Paso 3. Tras cargar el historial, el frontend se suscribe al canal privado de WebSocket `conversation.{conversationId}` mediante Laravel Echo. La suscripción pasa por la autorización definida en `routes/channels.php`, que ejecuta una consulta para verificar nuevamente que el usuario sea participante de la conversación.

Paso 4. El usuario redacta un mensaje en el campo de texto y presiona Enter o el botón de enviar. Si adjunta un archivo, lo selecciona mediante el input de archivos con límite de 20 megabytes. El frontend construye un objeto `FormData` con el identificador de la conversación, el contenido textual y, opcionalmente, el archivo adjunto.

Paso 5. El frontend llama a `POST /api/messages` con el FormData. El backend procesa la petición en `MessageController::store`. Valida que la conversación exista y que el usuario sea participante, que el contenido sea string o que exista un archivo adjunto, y que el archivo no supere los 20 megabytes.

Paso 6. Si la petición incluye un archivo adjunto, el backend lo almacena en la ruta `documents/chat/{conversationId}/` del disco `public` y crea un registro en la tabla `documents` con visibilidad `private`, asociado al usuario emisor. Si la petición no incluye archivo pero referencia un documento existente, el backend valida que el usuario tenga acceso a dicho documento.

Paso 7. El backend crea el registro del mensaje en la tabla `messages`, asociándolo a la conversación, al emisor y opcionalmente al documento adjunto. Establece el tipo como `file` si hay adjunto o `text` si es solo texto.

Paso 8. El backend ejecuta `broadcast(new MessageSent($message))->toOthers()`. El método `toOthers()` excluye al emisor actual del conjunto de destinatarios. El servidor Reverb recibe el evento, identifica a los suscriptores del canal `conversation.{conversationId}` y entrega el payload a cada uno mediante la conexión WebSocket persistente.

Paso 9. En el frontend, el listener del canal agrega el mensaje recibido al estado local de la conversación. Si la conversación está visible y el usuario está cerca del final del área de scroll, el autoscroll lleva la vista al último mensaje. Si la conversación no está activa, se incrementa el contador de no leídos en `sessionStorage` y se muestra una notificación visual transitoria.

Paso 10. Adicionalmente, el frontend mantiene un `BroadcastChannel` del navegador sincronizado con el identificador `pr-intra-front-chat-sync`. Este canal permite que múltiples pestañas del mismo usuario reciban los mensajes nuevos sin pasar por el WebSocket del servidor, reduciendo la latencia entre pestañas y simplificando el manejo de estado local.

Como mejora planificada para la Iteración 2, se conectará la tabla `message_reads` al contador de no leídos, de modo que el contador provenga del backend y sea persistente entre dispositivos en lugar de residir en `sessionStorage` del cliente.

---

## 11. Decisiones de diseño

### DD-1 — Sanctum PAT sobre Sanctum SPA

**Contexto.** El frontend y el backend son aplicaciones independientes que se ejecutan en puertos distintos y no comparten cookies de sesión.

**Decisión.** Se utiliza Sanctum con Personal Access Tokens (PAT) en lugar de Sanctum SPA.

**Justificación.** Los PAT no requieren cookies compartidas, son portables entre dispositivos, se revocan individualmente por dispositivo, y se almacenan hasheados en la base de datos. SPA Sanctum exige que frontend y backend compartan un dominio o subdominio, lo cual no aplica en este proyecto.

### DD-2 — Reverb como servidor WebSocket principal

**Contexto.** El sistema necesita entregar mensajes de chat en tiempo real sin polling.

**Decisión.** Se utiliza Laravel Reverb como servidor WebSocket principal. Pusher queda configurado como fallback opcional.

**Justificación.** Reverb es la solución oficial de Laravel, no tiene costo operativo, y se integra de forma nativa con los eventos y canales del framework. Pusher se mantiene como fallback para entornos donde Reverb no esté disponible o donde se requiera una solución gestionada.

### DD-3 — MariaDB sobre MySQL puro

**Contexto.** El stack original del proyecto mencionaba MySQL como base de datos.

**Decisión.** Se utiliza MariaDB, manteniendo compatibilidad con MySQL.

**Justificación.** MariaDB ofrece mejor rendimiento en operaciones de lectura, es la opción por defecto en Laravel Herd (entorno de desarrollo local del equipo), y mantiene compatibilidad con la API y drivers de MySQL. La conexión se configura con `DB_CONNECTION=mariadb` en el archivo `.env`, pero todas las consultas y migraciones son compatibles con MySQL 8.

### DD-4 — BroadcastChannel del navegador

**Contexto.** Un usuario puede tener Coherev abierto en múltiples pestañas simultáneamente.

**Decisión.** Se implementa un `BroadcastChannel` del navegador con el identificador `pr-intra-front-chat-sync` para sincronizar el estado de las conversaciones entre pestañas del mismo usuario.

**Justificación.** Sin esta sincronización, los mensajes enviados desde una pestaña no aparecen instantáneamente en otras pestañas del mismo usuario. El BroadcastChannel permite comunicación inmediata entre contextos del navegador sin pasar por el servidor WebSocket, reduciendo latencia y simplificando el manejo de estado local.

### DD-5 — Almacenamiento de token por sesión

**Contexto.** El token de acceso es un secreto persistente que debe protegerse.

**Decisión.** El token se almacena en `localStorage` solo si el usuario marca la casilla "mantener sesión iniciada"; en caso contrario se almacena en `sessionStorage`, lo que limita la persistencia al cierre de la pestaña.

**Justificación.** El uso de `sessionStorage` por defecto reduce la ventana de exposición del token en caso de acceso no autorizado al dispositivo. `localStorage` se reserva para el caso explícito en que el usuario solicita persistencia entre sesiones.

### DD-6 — Validación con Form Requests

**Contexto.** Toda escritura al sistema debe validarse antes de persistir.

**Decisión.** Se utiliza el sistema de Form Requests de Laravel para validar cada endpoint, en lugar de validación inline en controladores.

**Justificación.** Las Form Requests centralizan las reglas de validación, permiten mensajes de error personalizados, son fácilmente testeables, y separan la responsabilidad de validación de la responsabilidad del controlador. Esto facilita el cumplimiento del atributo de calidad de seguridad.

### DD-7 — Tailwind CSS v4 con tokens semánticos

**Contexto.** La interfaz de usuario requiere coherencia visual y facilidad de mantenimiento de estilos.

**Decisión.** Se utiliza Tailwind CSS v4 con un sistema de tokens semánticos referidos a la marca Coherev.

**Justificación.** Tailwind permite componer estilos sin escribir CSS personalizado, lo que reduce el riesgo de inconsistencias. Los tokens semánticos permiten que el rebranding de marca (Iteración 5) se aplique modificando solo los valores de los tokens, sin tocar las páginas individuales.

---

## 12. Riesgos y mitigaciones

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Inconsistencia entre la documentación y el código | Media | Media | Este documento se actualiza junto con cada cambio arquitectónico. Se valida en code review que los PR incluyan actualización de `docs/` cuando corresponda. |
| R2 | Endpoints sin autorización accidental | Media | Alta | Los PR que agreguen rutas nuevas deben pasar por revisión de seguridad explícita. Se planea agregar un test automatizado que recorra todos los endpoints y valide que devuelven 401 sin token y 403 sin permisos. |
| R3 | Caída del servidor Reverb en producción | Baja | Alta | Pusher queda configurado como fallback. El cliente detecta la caída y reintenta la conexión con backoff exponencial. |
| R4 | Crecimiento descontrolado de la base de datos | Baja | Media | Se implementarán políticas de retención para `messages` y `message_reads` en iteraciones futuras. Se monitorea el tamaño de las tablas con consultas de diagnóstico. |
| R5 | Pérdida de tokens Sanctum por acceso no autorizado a la base de datos | Baja | Alta | Los tokens se almacenan hasheados (SHA-256). Un atacante con acceso a la tabla no puede recuperar los tokens en texto plano. Adicionalmente, los tokens se pueden revocar individualmente. |
| R6 | Cambios en breaking changes de Laravel o Next.js | Baja | Media | Las dependencias se fijan en `composer.json` y `package.json` con versiones específicas. Se actualizan solo cuando el equipo lo aprueba explícitamente. |
| R7 | Sobrecarga del canal WebSocket con muchos usuarios | Baja | Media | Reverb está diseñado para escalar horizontalmente. En caso necesario, se pueden agregar múltiples instancias detrás de un balanceador. |
| R8 | Discrepancia entre el stack declarado en la presentación PPT y el stack real | Alta detectada | Baja | Se actualizará la presentación PPT para reflejar MariaDB (no MySQL), Figma (no Canva), y la inclusión de Laravel Reverb como servidor WebSocket. Esta actualización se realiza en la Iteración 6 de cierre. |

---

## 13. Conclusiones

La arquitectura de Coherev cumple los objetivos planteados al inicio del proyecto: separar claramente las responsabilidades entre cliente y servidor, garantizar la seguridad por defecto en todos los endpoints, mantener trazabilidad extremo a extremo entre problema y código, entregar tiempo real sin polling y fomentar la reutilización de componentes transversales.

El modelo de cinco capas en el backend (HTTP, Dominio, Persistencia, Autorización, Tiempo Real) facilita la comprensión del código, la incorporación de nuevos integrantes y la aplicación de pruebas automatizadas. El frontend con tres capas (Rutas, Componentes, Servicios) sigue el mismo principio de separación de responsabilidades.

Las decisiones de diseño registradas en la sección 11 están alineadas con las restricciones del proyecto académico y son fácilmente reversibles si el equipo lo requiere en iteraciones futuras. Los riesgos identificados en la sección 12 tienen mitigaciones concretas, varias de las cuales se implementarán en la Iteración 1 del roadmap.

El sistema se encuentra listo para soportar las próximas iteraciones del proyecto: la Iteración 1 de Seguridad y Roles, que cerrará las brechas de autorización; la Iteración 2 de Cobertura funcional, que completará los módulos Tareas, Directorio y Panel Novedades; y la Iteración 5 de Rebranding Coherev, que aplicará la nueva identidad de marca sin afectar la arquitectura subyacente.

Este documento se entrega como parte de la documentación técnica del proyecto y responde la observación número 7 emitida por la docente Cindy Betzabé Contador Cisterna respecto a la necesidad de incorporar un diagrama de arquitectura en la presentación final. La trazabilidad con las historias de usuario, los requisitos funcionales y los casos de prueba se mantiene en el documento `TRACEABILITY.md`.

---

## 14. Referencias bibliográficas

1. Laravel Framework. (2025). *Laravel Documentation v13.x*. Recuperado de https://laravel.com/docs
2. Laravel Sanctum. (2025). *API Authentication using Sanctum*. Recuperado de https://laravel.com/docs/sanctum
3. Laravel Reverb. (2025). *Reverb: Real-time WebSocket Broadcasting*. Recuperado de https://laravel.com/docs/reverb
4. Vercel. (2025). *Next.js Documentation v16*. Recuperado de https://nextjs.org/docs
5. Tailwind Labs. (2025). *Tailwind CSS Documentation v4*. Recuperado de https://tailwindcss.com/docs
6. MariaDB Foundation. (2025). *MariaDB Server Documentation*. Recuperado de https://mariadb.com/kb/en/documentation/
7. Kruchten, P. (1995). *The 4+1 View Model of Architecture*. IEEE Software, 12(6), 42-50.
8. Bass, L., Clements, P., & Kazman, R. (2003). *Software Architecture in Practice* (2nd ed.). Addison-Wesley Professional.
9. OWASP Foundation. (2025). *OWASP Top Ten Security Risks*. Recuperado de https://owasp.org/www-project-top-ten/

---

## 15. Anexos

### Anexo A — Glosario de endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/login` | Autenticación y emisión de token |
| GET | `/api/me` | Datos del usuario autenticado |
| POST | `/api/logout` | Cierre de sesión |
| GET | `/api/users` | Listado de usuarios |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users/{id}` | Detalle de usuario |
| PATCH | `/api/users/{id}` | Actualizar usuario |
| DELETE | `/api/users/{id}` | Eliminar usuario |
| GET | `/api/users/{id}/roles` | Roles de un usuario |
| PUT | `/api/users/{id}/roles` | Sincronizar roles de un usuario |
| GET | `/api/roles` | Listado de roles |
| POST | `/api/roles` | Crear rol |
| PATCH | `/api/roles/{id}` | Actualizar rol |
| DELETE | `/api/roles/{id}` | Eliminar rol |
| GET | `/api/departments` | Listado de departamentos |
| POST | `/api/departments` | Crear departamento |
| PATCH | `/api/departments/{id}` | Actualizar departamento |
| DELETE | `/api/departments/{id}` | Eliminar departamento |
| GET | `/api/departments/{id}/folders` | Carpetas de un departamento |
| POST | `/api/departments/{id}/folders` | Crear carpeta |
| GET | `/api/documents` | Listado de documentos filtrados por permisos |
| GET | `/api/documents/{id}/download` | Descarga de documento |
| GET | `/api/announcements` | Listado de publicaciones |
| POST | `/api/announcements` | Crear publicación |
| PATCH | `/api/announcements/{id}` | Actualizar publicación |
| DELETE | `/api/announcements/{id}` | Eliminar publicación |
| GET | `/api/announcements/{id}/comments` | Comentarios de una publicación |
| POST | `/api/announcements/{id}/comments` | Comentar publicación |
| GET | `/api/announcements/{id}/attachments/{attachmentId}/download` | Descarga de adjunto |
| GET | `/api/conversations` | Conversaciones del usuario |
| POST | `/api/conversations` | Crear conversación |
| DELETE | `/api/conversations/{id}` | Eliminar conversación |
| GET | `/api/conversations/{id}/messages` | Mensajes de una conversación |
| POST | `/api/messages` | Enviar mensaje |
| DELETE | `/api/messages/{id}` | Eliminar mensaje |

### Anexo B — Estructura del repositorio

```
intranet/
├── backend/                      # Aplicación Laravel 13
│   ├── app/
│   │   ├── Events/               # Eventos de broadcasting
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # Controladores REST
│   │   │   ├── Requests/         # Validaciones
│   │   │   └── Resources/        # Serializadores JSON
│   │   ├── Models/               # Entidades Eloquent
│   │   └── Policies/             # Autorización por modelo
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   ├── migrations/           # Esquema relacional
│   │   ├── seeders/              # Datos iniciales
│   │   └── factories/            # Generadores de datos de prueba
│   ├── public/                   # Punto de entrada HTTP
│   ├── resources/
│   ├── routes/
│   │   ├── api.php               # Rutas de API REST
│   │   ├── channels.php          # Autorización de canales WebSocket
│   │   ├── console.php
│   │   └── web.php
│   ├── storage/
│   ├── tests/
│   ├── composer.json
│   └── .env
├── frontend/                     # Aplicación Next.js 16
│   ├── app/
│   │   ├── page.tsx              # Login
│   │   └── dashboard/            # Vistas autenticadas
│   │       ├── page.tsx          # Inicio
│   │       ├── conversations/
│   │       ├── documents/
│   │       ├── publications/
│   │       ├── departments/
│   │       ├── users/
│   │       └── roles/
│   ├── components/               # Componentes reutilizables
│   ├── lib/                      # Servicios de integración
│   │   ├── api-client.ts
│   │   ├── auth-token.ts
│   │   └── echo-client.ts
│   ├── public/                   # Assets estáticos
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
├── docs/                         # Documentación técnica y académica
│   ├── BACKLOG.md
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md           # Este documento
│   ├── DATABASE.md
│   ├── REQUIREMENTS.md
│   ├── USER_STORIES.md
│   ├── TRACEABILITY.md
│   └── evidence/                 # Capturas y actas de pruebas
└── README.md                     # Descripción general del proyecto
```

### Anexo C — Configuración del entorno

Variables de entorno relevantes del backend (archivo `.env`):

```
APP_NAME=Coherev
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coherev
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=coherev
REVERB_APP_KEY=local-reverb-key
REVERB_APP_SECRET=local-reverb-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

BCRYPT_ROUNDS=12
```

Variables de entorno relevantes del frontend (archivo `.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api

NEXT_PUBLIC_REVERB_APP_KEY=local-reverb-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

---

**Fin del documento**

*Documento de Arquitectura de Software — Coherev — Versión 1.0 — Septiembre 2026*
