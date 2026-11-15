# Requerimientos Funcionales y No Funcionales — Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Entregable | Requerimientos F y NF — Observación 2 |
| Versión | 1.0 (Markdown regenerado el 15 de noviembre de 2026) |
| Fuente canónica | `docs/Fase 2.1/8 y 9-requerimientos F y NF.docx` |
| Integrantes | Benjamín Herrera (Backend) / Julián Tapia (Frontend) |
| Docente guía | Cindy Betzabé Contador Cisterna |

## 1. Introducción y propósito

Coherev es una intranet corporativa que centraliza la comunicación interna, el contenido, la gestión documental y el control de acceso por roles dentro de una organización. Está construida como monorepo de dos aplicaciones independientes: una API REST con Laravel 13 (backend) y una interfaz web con Next.js 16 (frontend), comunicadas por HTTP/HTTPS y WebSocket.

Este documento define los requerimientos funcionales y no funcionales que guían el desarrollo, la validación con usuarios reales y la entrega final del proyecto, sirviendo además como evidencia para la Observación 2 (RF/RNF) del feedback académico.

## 2. Alcance del sistema

El sistema cubre los siguientes módulos funcionales:

| N. | Módulo | Estado |
| --- | --- | --- |
| 1 | Autenticación y sesión | Implementado (Iter 0) |
| 2 | Usuarios | Implementado |
| 3 | Roles y permisos | En refactor (Iter 1) |
| 4 | Departamentos y carpetas | Implementado |
| 5 | Chat en tiempo real | Implementado (contador de no leídos pendiente) |
| 6 | Publicaciones y comentarios | Implementado |
| 7 | Documentos | Implementado |
| 8 | Tareas (tablero Kanban) | Previsto (Iter 2) |
| 9 | Directorio de colaboradores | Previsto (Iter 2) |
| 10 | Panel de Novedades | Previsto (Iter 2) |

> El estado de la columna anterior corresponde al corte del documento de la Fase 2.1. El estado real al 15 de noviembre de 2026 está en el [checklist de término](docs/Fase%202.2/6-Checklist%20de%20termino%20del%20proyecto.md): 7 de 10 módulos operativos.

## 3. Actores y roles

Los roles definen lo que cada usuario puede ver y hacer dentro de la plataforma:

| Actor | Descripción |
| --- | --- |
| Administrador | Acceso total: gestiona usuarios, roles, departamentos, documentos y contenido. |
| Líder | Gestiona su equipo: ve departamentos (sin eliminar), gestiona tareas y publica en su departamento. |
| Colaborador | Uso diario: chat, documentos de lectura y publicaciones. |
| Nuevo Ingreso | Rol temporal: ve el Panel de Novedades destacado y el contenido público. |
| Sistema (backend) | Orquesta la API, la autorización y los eventos en tiempo real. |

## 4. Requerimientos funcionales (RF)

Convención de prioridades: Alta, Media o Baja.

### 4.1 Módulo Autenticación y sesión (RF-AUT)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-AUT-01 | Autenticar al usuario mediante correo corporativo y contraseña en POST /login. | Alta |
| RF-AUT-02 | Permitir "mantener la sesión iniciada": token en localStorage o sessionStorage según la preferencia. | Alta |
| RF-AUT-03 | Limitar el login a 5 intentos por minuto por IP y correo, respondiendo 429 al superar el límite. | Alta |
| RF-AUT-04 | Responder con mensaje genérico ante credenciales inválidas sin revelar si el correo existe. | Alta |
| RF-AUT-05 | Validar la sesión en GET /me devolviendo el usuario con sus roles y permisos. | Alta |
| RF-AUT-06 | Revocar el token del dispositivo al cerrar sesión (POST /logout) y limpiar el almacenamiento del cliente. | Alta |
| RF-AUT-07 | Enviar el token en cada petición protegida mediante Authorization: Bearer (Sanctum PAT). | Alta |
| RF-AUT-08 | Responder 401 ante token inválido o expirado; el frontend limpia la sesión y redirige al login. | Alta |

### 4.2 Módulo Usuarios (RF-USR)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-USR-01 | Solo un Administrador puede listar, ver, crear, editar y eliminar usuarios. | Alta |
| RF-USR-02 | Crear usuarios con nombre, correo corporativo único y contraseña de mínimo 8 caracteres confirmada. | Alta |
| RF-USR-03 | Permitir la asignación de roles a un usuario (PUT /users/{user}/roles). | Alta |
| RF-USR-04 | Asociar cada usuario a un departamento. | Alta |
| RF-USR-05 | Rechazar con 403 cualquier operación de gestión de usuarios por un usuario sin rol Administrador. | Alta |

### 4.3 Módulo Roles y permisos (RF-ROL)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-ROL-01 | Modelar los 4 roles del negocio: Administrador, Líder, Colaborador y Nuevo Ingreso, precargados por seeder. | Alta |
| RF-ROL-02 | Permitir solo al Administrador crear, editar y eliminar roles; lectura abierta para autenticados. | Alta |
| RF-ROL-03 | Asociar cada rol a un departamento y exponer el permiso booleano can_post_announcements. | Alta |
| RF-ROL-04 | Centralizar el permiso de publicación (canManageAnnouncements) por rol y cubrirlo con tests. | Alta |
| RF-ROL-05 | Adaptar sidebar y rutas según el rol: Novedades (Nuevo Ingreso), Tareas (Líder), chat y documentos (Colaborador) y todo (Administrador). | Alta |

### 4.4 Módulo Departamentos y carpetas (RF-DEP)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-DEP-01 | Solo el Administrador puede crear, editar y eliminar departamentos; los Líderes solo pueden verlos. | Alta |
| RF-DEP-02 | Al eliminar un departamento, eliminar en cascada sus roles asociados. | Alta |
| RF-DEP-03 | Listar y crear carpetas documentales por departamento. | Media |
| RF-DEP-04 | Permitir subir documentos a una carpeta de departamento. | Media |

### 4.5 Módulo Chat en tiempo real (RF-CHT)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-CHT-01 | Listar las conversaciones en las que participa el usuario autenticado. | Alta |
| RF-CHT-02 | Crear conversaciones privadas (1 usuario) o grupales (2 o más), calculando el tipo automáticamente. | Alta |
| RF-CHT-03 | Entregar el historial solo a participantes de la conversación (403 en caso contrario). | Alta |
| RF-CHT-04 | Permitir el envío de mensajes de texto. | Alta |
| RF-CHT-05 | Permitir adjuntos de hasta 20 MB en los mensajes. | Media |
| RF-CHT-06 | Entregar mensajes en tiempo real vía WebSocket (Reverb, con Pusher como fallback) en canal privado conversation.{id}. | Alta |
| RF-CHT-07 | Autorizar la suscripción al canal solo a los participantes de la conversación. | Alta |
| RF-CHT-08 | Registrar la lectura de mensajes en la tabla message_reads al abrir una conversación. | Media |
| RF-CHT-09 | Calcular el contador de no leídos desde la base de datos, no desde el cliente. | Media |
| RF-CHT-10 | Sincronizar el estado del chat entre pestañas del mismo usuario (BroadcastChannel). | Media |
| RF-CHT-11 | Permitir solo al Administrador eliminar mensajes y conversaciones. | Alta |

### 4.6 Módulo Publicaciones y comentarios (RF-PUB)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-PUB-01 | Mostrar publicaciones según su visibilidad y el departamento o rol del usuario. | Alta |
| RF-PUB-02 | Permitir crear publicaciones solo a usuarios con permiso can_post_announcements. | Alta |
| RF-PUB-03 | Editar y eliminar publicaciones según la AnnouncementPolicy (creador o Administrador). | Media |
| RF-PUB-04 | Permitir adjuntar archivos a una publicación y descargarlos. | Media |
| RF-PUB-05 | Validar el MIME real de los adjuntos antes de almacenarlos. | Alta |
| RF-PUB-06 | Permitir comentar publicaciones visibles del propio departamento. | Media |
| RF-PUB-07 | Eliminar un comentario por su autor o, según política, por el Administrador o creador de la publicación. | Media |

### 4.7 Módulo Documentos (RF-DOC)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-DOC-01 | Listar y mostrar documentos según su visibilidad (public, department, private). | Alta |
| RF-DOC-02 | Subir, editar y eliminar documentos solo por su dueño o un Administrador. | Alta |
| RF-DOC-03 | Permitir la descarga de documentos autorizados. | Media |
| RF-DOC-04 | Validar el MIME real de los archivos, rechazando con 415 los que no coincidan. | Alta |
| RF-DOC-05 | Almacenar archivos en carpetas funcionales del disco público (announcements, documents/department, documents/chat). | Media |

### 4.8 Módulos previstos (RF-FUT)

| ID | Requerimiento | Prioridad |
| --- | --- | --- |
| RF-FUT-01 | Módulo Tareas: tablero Kanban interno por equipo, visible para Líderes y Administradores (Iter 2). | Media |
| RF-FUT-02 | Módulo Directorio: vista pública de colaboradores (Iter 2). | Media |
| RF-FUT-03 | Panel de Novedades: contenido destacado para el rol Nuevo Ingreso (Iter 2). | Media |
| RF-FUT-04 | Búsqueda global por usuarios, documentos y mensajes (roadmap). | Baja |
| RF-FUT-05 | Notificaciones push para anuncios y mensajes (roadmap). | Baja |
| RF-FUT-06 | Auditoría y logs de actividad por usuario (roadmap). | Baja |

## 5. Requerimientos no funcionales (RNF)

### 5.1 Seguridad (RNF-SEG)

| ID | Requerimiento |
| --- | --- |
| RNF-SEG-01 | Toda comunicación debe usar HTTPS en producción; el token viaja en el header Authorization: Bearer. |
| RNF-SEG-02 | Contraseñas con hash bcrypt y tokens Sanctum almacenados solo como hash en la base de datos. |
| RNF-SEG-03 | La contraseña del usuario no debe aparecer en ninguna respuesta de la API. |
| RNF-SEG-04 | Toda ruta debe exigir autenticación (auth:sanctum) salvo el login; operaciones sensibles con middleware admin y Policies. |
| RNF-SEG-05 | Validar toda entrada con Form Requests (tipo, formato, tamaño, unicidad) antes de tocar el modelo. |
| RNF-SEG-06 | Validar el MIME real en todos los endpoints de subida de archivos. |
| RNF-SEG-07 | Rate-limiting del login: 5 intentos por minuto por IP y correo. |
| RNF-SEG-08 | Tokens revocables por dispositivo (logout o gestión administrativa). |
| RNF-SEG-09 | Errores de credenciales genéricos que no revelen la existencia del correo. |

### 5.2 Rendimiento (RNF-REN)

| ID | Requerimiento |
| --- | --- |
| RNF-REN-01 | Paginación de historiales de mensajes y listados grandes. |
| RNF-REN-02 | Eager loading en las consultas para evitar el problema N+1. |
| RNF-REN-03 | Tiempo de respuesta menor a 500 ms en el 95 % de las peticiones de lectura (entorno local). |
| RNF-REN-04 | Notificación de un mensaje en tiempo real en menos de 500 ms desde su envío. |
| RNF-REN-05 | Dashboard con contenido inicial (LCP) por debajo de 2.5 s en hardware representativo. |
| RNF-REN-06 | Reutilización de componentes y tokens para evitar duplicación de estilos y lógica. |

### 5.3 Usabilidad y accesibilidad (RNF-UXA)

| ID | Requerimiento |
| --- | --- |
| RNF-UXA-01 | Cumplir pautas WCAG nivel AA (contraste, foco visible, aria-label en controles solo-icono). |
| RNF-UXA-02 | Errores de formulario por campo, con foco al primer campo inválido. |
| RNF-UXA-03 | Interfaz responsive, con sidebar tipo drawer en móvil y chat usable en pantallas pequeñas. |
| RNF-UXA-04 | Onboarding guiado para nuevos usuarios (driver.js) en un tour de hasta 5 pasos. |
| RNF-UXA-05 | Estados vacíos ilustrados y consistentes, con llamado a la acción contextual. |
| RNF-UXA-06 | Mensajes de error 4xx/5xx claros y con microcopy de marca Coherev. |
| RNF-UXA-07 | Un usuario nuevo debe completar las tareas principales en su primera sesión sin asistencia. |

### 5.4 Mantenibilidad (RNF-MANT)

| ID | Requerimiento |
| --- | --- |
| RNF-MANT-01 | Backend en patrón MVC por capas: controladores delgados, Form Requests y API Resources. |
| RNF-MANT-02 | Reglas de negocio en modelos y Policies, no en controladores. |
| RNF-MANT-03 | Cobertura de la funcionalidad crítica con tests PHPUnit; sin romper la suite existente. |
| RNF-MANT-04 | Código consistente con Laravel Pint y las convenciones del monorepo. |
| RNF-MANT-05 | Documentación mantenida del proyecto (API, arquitectura, esquema ER, trazabilidad). |
| RNF-MANT-06 | Integraciones externas concentradas en la carpeta lib/ del frontend. |
| RNF-MANT-07 | Versionado público de la API planificado a futuro (/api/v1, /api/v2). |

### 5.5 Disponibilidad, compatibilidad y portabilidad (RNF-DISP)

| ID | Requerimiento |
| --- | --- |
| RNF-DISP-01 | Funcionamiento en entorno local (Laravel Herd) y despliegue sin dependencias de terceros pagados. |
| RNF-DISP-02 | Capa de tiempo real con Reverb como servidor principal y Pusher como fallback configurable. |
| RNF-DISP-03 | Base de datos MariaDB (compatible MySQL) accedida exclusivamente mediante Eloquent. |
| RNF-DISP-04 | Compatibilidad con navegadores modernos (Chrome, Edge y Firefox en sus últimas 2 versiones). |
| RNF-DISP-05 | Persistencia del token según preferencia (localStorage o sessionStorage). |
| RNF-DISP-06 | Invalidación de la sesión en todas las pestañas al recibir un 401 en cualquiera. |

## 6. Priorización general

| Grupo | Prioridad | Iteración asociada |
| --- | --- | --- |
| Autenticación, seguridad y roles | Bloqueante | Iter 1 |
| Cobertura funcional (Tareas, Directorio, Novedades, MessageRead) | Alta | Iter 2 |
| Documentación RF/RNF | Media | Iter 3 |
| Validación con usuarios | Media | Iter 4 |
| Rebranding Coherev + polish UX | Media | Iter 5 |

## 7. Referencias

Las historias de usuario se documentan en [USER_STORIES.md](USER_STORIES.md) y la matriz de trazabilidad (Problema – Requerimiento – Historia de usuario – Funcionalidad – Prueba) en [TRACEABILITY.md](TRACEABILITY.md). El esquema de datos se documenta en [DATABASE.md](DATABASE.md). El backlog de evolución vive en `docs/Fase 2.1/11-product backlog.xlsx`.


---

Documento generado desde las fuentes del repositorio: el `.docx` de la Fase 2.1, el esquema real de MariaDB y las migraciones de Laravel. Su fuente canónica sigue siendo el `.docx`; este Markdown existe para que la trazabilidad sea consultable en el repositorio.
