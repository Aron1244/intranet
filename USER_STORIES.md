# Historias de Usuario — Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Entregable | Historias de Usuario — Observación 6 |
| Versión | 1.0 (Markdown regenerado el 15 de noviembre de 2026) |
| Fuente canónica | `docs/Fase 2.1/10-historias de usuario.docx` |
| Integrantes | Benjamín Herrera (Backend) / Julián Tapia (Frontend) |
| Docente guía | Cindy Betzabé Contador Cisterna |

## 1. Proyecto y formato

Proyecto: Coherev — Sistema de Intranet Corporativa.

Formato: *Como [rol], quiero [funcionalidad], para [beneficio]*.

Criterio: al menos 12 historias distribuidas en los 4 roles (mínimo 3 por rol). Roles: Administrador · Líder · Colaborador · Nuevo Ingreso.

## 2. Historias de usuario

### 2.1 Rol: Administrador

#### HU-001 · Iniciar sesión en Coherev

Como Administrador, quiero iniciar sesión con mi correo corporativo y contraseña (con la opción de mantener la sesión), para acceder al panel de administración de Coherev.

**Criterios de aceptación:**

- El formulario solicita correo, contraseña y la casilla "mantener sesión iniciada".
- Con credenciales válidas, se ingresa al dashboard y se valida la sesión con GET /me.
- Con credenciales inválidas, se muestra un mensaje genérico sin revelar si el correo existe.
- Tras 5 intentos fallidos por minuto, la API responde 429.

**RF asociado: RF-AUT-01, RF-AUT-02, RF-AUT-04, RF-AUT-05**

#### HU-002 · Gestionar usuarios del directorio

Como Administrador, quiero crear, editar, eliminar usuarios y asignarles roles, para mantener el directorio y los accesos del equipo actualizados.

**Criterios de aceptación:**

- Solo el rol Administrador accede a la gestión de usuarios; un no-admin recibe 403.
- La creación exige nombre, correo con formato válido y único, y contraseña de mínimo 8 caracteres confirmada.
- Los roles de cada usuario pueden sincronizarse desde la vista de administración.

**RF asociado: RF-USR-01, RF-USR-02, RF-USR-03, RF-USR-05**

#### HU-003 · Gestionar departamentos y roles

Como Administrador, quiero crear, editar y eliminar departamentos y sus roles asociados, para reflejar la estructura organizacional de la empresa en la intranet.

**Criterios de aceptación:**

- Solo el Administrador puede modificar departamentos y roles.
- Cada rol pertenece a un departamento y expone el permiso can_post_announcements.
- Al eliminar un departamento, sus roles se eliminan en cascada.

**RF asociado: RF-DEP-01, RF-DEP-02, RF-ROL-02, RF-ROL-03**


### 2.2 Rol: Líder

#### HU-004 · Consultar departamentos

Como Líder, quiero ver los departamentos y sus responsables, para conocer la estructura de los equipos sin poder modificarla.

**Criterios de aceptación:**

- El Líder visualiza la lista de departamentos en modo solo lectura.
- Las acciones de crear, editar o eliminar departamentos no están disponibles; la API rechaza el intento con 403.

**RF asociado: RF-DEP-01**

#### HU-005 · Publicar novedades para el equipo

Como Líder, quiero crear publicaciones dirigidas a mi departamento y adjuntar archivos, para mantener informado a mi equipo de forma oportuna.

**Criterios de aceptación:**

- Solo usuarios con permiso can_post_announcements pueden crear publicaciones.
- La publicación permite adjuntar archivos, validando el MIME real antes de almacenarlos.
- Las publicaciones se muestran a los usuarios del departamento según su visibilidad.

**RF asociado: RF-PUB-01, RF-PUB-02, RF-PUB-04, RF-PUB-05**

#### HU-006 · Coordinar tareas del equipo

Como Líder, quiero gestionar un tablero Kanban de tareas del equipo, para asignar y seguir el avance del trabajo en un solo lugar.

**Criterios de aceptación:**

- El módulo Tareas está disponible para Líderes y Administradores.
- El tablero permite crear tareas y moverlas entre columnas de estado.
- Cada tarea queda vinculada al departamento o equipo del Líder.

**RF asociado: RF-FUT-01, RF-ROL-05**


### 2.3 Rol: Colaborador

#### HU-007 · Chatear en tiempo real

Como Colaborador, quiero conversar en chat privado y grupal en tiempo real con mis compañeros, para coordinarme sin salir de la intranet.

**Criterios de aceptación:**

- El usuario ve solo las conversaciones en las que participa.
- Los mensajes llegan en tiempo real vía WebSocket por el canal privado de la conversación.
- Puedo enviar texto y adjuntos de hasta 20 MB.
- El historial solo es legible por los participantes de la conversación.

**RF asociado: RF-CHT-01, RF-CHT-03, RF-CHT-06**

#### HU-008 · Consultar documentos del departamento

Como Colaborador, quiero listar, ver y descargar los documentos de mi departamento, para consultar siempre la información vigente.

**Criterios de aceptación:**

- El listado respeta la visibilidad de cada documento (público, departamento, privado).
- Solo puedo descargar documentos a los que tengo acceso.
- La descarga está disponible para documentos compartidos del propio departamento.

**RF asociado: RF-DOC-01, RF-DOC-03**

#### HU-009 · Participar en publicaciones del departamento

Como Colaborador, quiero ver las publicaciones de mi departamento y comentarlas, para participar de la conversación interna.

**Criterios de aceptación:**

- Veo solo las publicaciones visibles para mi rol y departamento.
- Puedo comentar publicaciones del propio departamento.
- Puedo eliminar mis propios comentarios.

**RF asociado: RF-PUB-01, RF-PUB-06, RF-PUB-07**

#### HU-010 · Revisar mensajes no leídos

Como Colaborador, quiero ver el contador de mensajes no leídos por conversación, para priorizar la comunicación pendiente.

**Criterios de aceptación:**

- Al abrir una conversación, sus mensajes se marcan como leídos en message_reads.
- El contador se calcula desde la base de datos y se sincroniza entre pestañas.

**RF asociado: RF-CHT-08, RF-CHT-09, RF-CHT-10**


### 2.4 Rol: Nuevo Ingreso

#### HU-011 · Completar el onboarding guiado

Como Nuevo Ingreso, quiero realizar un tour guiado por los módulos principales, para familiarizarme con Coherev en mi primera sesión sin apoyo externo.

**Criterios de aceptación:**

- Al primer ingreso se ofrece un tour de hasta 5 pasos que recorre las secciones clave.
- Puedo avanzar, retroceder o finalizar el recorrido en cualquier momento.
- El tour aparece una sola vez por sesión inicial; puede repetirse desde la barra lateral.

**RF asociado: RNF-UXA-04**

#### HU-012 · Consultar el Panel de Novedades

Como Nuevo Ingreso, quiero tener un panel de novedades destacado con la información clave de la organización, para ponerme al día rápidamente al incorporarme.

**Criterios de aceptación:**

- El rol Nuevo Ingreso ve el Panel de Novedades destacado en el sidebar.
- El panel presenta comunicados y contenido de bienvenida públicos.

**RF asociado: RF-FUT-03, RF-ROL-05**

#### HU-013 · Conocer al equipo en el Directorio

Como Nuevo Ingreso, quiero consultar el directorio de colaboradores con nombre, área y rol, para reconocer a mis compañeros y contactar al área correcta.

**Criterios de aceptación:**

- El directorio es de acceso público para usuarios autenticados.
- Cada entrada muestra el perfil básico del colaborador y su departamento.

**RF asociado: RF-FUT-02**


## 3. Resumen por rol

| Rol | Historias | Total |
| --- | --- | --- |
| Administrador | HU-001, HU-002, HU-003 | 3 |
| Líder | HU-004, HU-005, HU-006 | 3 |
| Colaborador | HU-007, HU-008, HU-009, HU-010 | 4 |
| Nuevo Ingreso | HU-011, HU-012, HU-013 | 3 |
| Total | HU-001 … HU-013 | 13 |

## 4. Referencias

Los requerimientos funcionales y no funcionales se detallan en [REQUIREMENTS.md](REQUIREMENTS.md). La matriz de trazabilidad (Problema → RF → HU → Funcionalidad → Prueba) se documenta en [TRACEABILITY.md](TRACEABILITY.md).


---

Documento generado desde las fuentes del repositorio: el `.docx` de la Fase 2.1, el esquema real de MariaDB y las migraciones de Laravel. Su fuente canónica sigue siendo el `.docx`; este Markdown existe para que la trazabilidad sea consultable en el repositorio.
