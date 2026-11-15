# Esquema de la base de datos — Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Motor | MariaDB 12.3.2 (compatible MySQL), motor InnoDB |
| Conexión | `DB_CONNECTION=mariadb`, host 127.0.0.1:3306, base `pr_intra_back` |
| Acceso | Exclusivamente por Eloquent sobre 11 modelos |
| Fuente canónica | `docs/Fase 2.1/15.1-esquema de la base de datos.sql` |
| Verificado | 15 de noviembre de 2026 sobre el commit 6b15daa |

## 1. Inventario de tablas

El esquema tiene **23 tablas**: 15 de dominio y 8 del framework de Laravel. Las de dominio se describen en detalle en el apartado 2; las de framework se listan en el apartado 3.

| Tabla | Filas aprox. | Descripción |
| --- | --- | --- |
| `announcements` | 32 | Publicaciones internas con su visibilidad (public, department, private). Borrado lógico. |
| `announcement_attachments` | 27 | Archivos adjuntos a una publicación. |
| `comments` | 55 | Comentarios sobre publicaciones. Borrado lógico. |
| `conversations` | 181 | Conversaciones privadas y grupales. Guardan el tipo calculado y el departamento cuando aplica. |
| `conversation_user` | 612 | Participantes de cada conversación. |
| `departments` | 9 | Estructura organizacional. La tabla tiene color para la identificación visual en el frontend. |
| `department_folders` | 16 | Carpetas documentales por departamento. |
| `department_user` | 0 | Relación N:N entre usuarios y departamentos. |
| `documents` | 152 | Documentos del sistema con su visibilidad, su carpeta de destino y su propietario. Borrado lógico. |
| `messages` | 2932 | Mensajes de texto con su adjunto opcional. Borrado lógico. |
| `message_reads` | 3863 | Lecturas por usuario y mensaje. Es la base del contador de no leídos. |
| `personal_access_tokens` | 6 | Tokens de Sanctum. Se guardan hasheados, nunca en claro. |
| `roles` | 7 | Los 4 roles del negocio más los alias heredados, con su departamento y el permiso can_post_announcements. |
| `users` | 301 | Cuentas de la intranet. El acceso se hace con correo corporativo y contraseña (bcrypt); el rol se resuelve por tabla puente. |
| `user_roles` | 305 | Relación N:N entre usuarios y roles. |

## 2. Tablas de dominio

### `announcements`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `title` | varchar(255) | no | — | — |
| `content` | text | no | — | — |
| `is_visible` | tinyint(1) | no | — | 0 |
| `department_id` | bigint(20) unsigned | sí | MUL | NULL |
| `created_by` | bigint(20) unsigned | no | MUL | — |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `created_by` → `users.id`
- `department_id` → `departments.id`

**Índices**

- `PRIMARY` (único): `id`

### `announcement_attachments`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `announcement_id` | bigint(20) unsigned | no | MUL | — |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `file_path` | varchar(255) | no | — | — |
| `original_name` | varchar(255) | no | — | — |
| `mime_type` | varchar(150) | sí | — | NULL |
| `size_bytes` | bigint(20) unsigned | sí | — | NULL |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `announcement_id` → `announcements.id`
- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `comments`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `announcement_id` | bigint(20) unsigned | no | — | — |
| `content` | text | no | — | — |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `conversations`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `name` | varchar(255) | sí | — | NULL |
| `type` | enum('private','group') | no | — | — |
| `department_id` | bigint(20) unsigned | sí | UNI | NULL |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `department_id` → `departments.id`

**Índices**

- `conversations_department_id_unique` (único): `department_id`
- `PRIMARY` (único): `id`

### `conversation_user`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `conversation_id` | bigint(20) unsigned | no | MUL | — |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `conversation_id` → `conversations.id`
- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `departments`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `name` | varchar(255) | no | — | — |
| `description` | varchar(255) | sí | — | NULL |
| `color` | varchar(7) | sí | — | NULL |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Índices**

- `PRIMARY` (único): `id`

### `department_folders`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `department_id` | bigint(20) unsigned | no | MUL | — |
| `parent_id` | bigint(20) unsigned | sí | MUL | NULL |
| `created_by` | bigint(20) unsigned | no | MUL | — |
| `name` | varchar(255) | no | — | — |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `created_by` → `users.id`
- `department_id` → `departments.id`
- `parent_id` → `department_folders.id`

**Índices**

- `department_folders_department_id_parent_id_name_unique` (único): `department_id,parent_id,name`
- `PRIMARY` (único): `id`

### `department_user`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `department_id` | bigint(20) unsigned | no | MUL | — |

**Claves foráneas**

- `department_id` → `departments.id`
- `user_id` → `users.id`

**Índices**

- `department_user_user_id_department_id_unique` (único): `user_id,department_id`
- `PRIMARY` (único): `id`

### `documents`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `title` | varchar(255) | no | — | — |
| `file_path` | varchar(255) | no | — | — |
| `original_name` | varchar(255) | sí | — | NULL |
| `mime_type` | varchar(255) | sí | — | NULL |
| `size_bytes` | bigint(20) unsigned | sí | — | NULL |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `department_folder_id` | bigint(20) unsigned | sí | MUL | NULL |
| `visibility` | enum('public','department','private') | no | — | — |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |
| `deleted_at` | timestamp | sí | — | NULL |
| `deleted_by` | bigint(20) unsigned | sí | MUL | NULL |

**Claves foráneas**

- `deleted_by` → `users.id`
- `department_folder_id` → `department_folders.id`
- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `messages`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `conversation_id` | bigint(20) unsigned | no | MUL | — |
| `sender_id` | bigint(20) unsigned | no | MUL | — |
| `content` | text | no | — | — |
| `document_id` | bigint(20) unsigned | sí | MUL | NULL |
| `type` | varchar(255) | no | — | 'text' |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |
| `deleted_at` | timestamp | sí | — | NULL |
| `deleted_by` | bigint(20) unsigned | sí | MUL | NULL |

**Claves foráneas**

- `conversation_id` → `conversations.id`
- `deleted_by` → `users.id`
- `document_id` → `documents.id`
- `sender_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `message_reads`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `message_id` | bigint(20) unsigned | no | MUL | — |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `read_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `message_id` → `messages.id`
- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

### `personal_access_tokens`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `tokenable_type` | varchar(255) | no | MUL | — |
| `tokenable_id` | bigint(20) unsigned | no | — | — |
| `name` | text | no | — | — |
| `token` | varchar(64) | no | UNI | — |
| `abilities` | text | sí | — | NULL |
| `last_used_at` | timestamp | sí | — | NULL |
| `expires_at` | timestamp | sí | MUL | NULL |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Índices**

- `personal_access_tokens_token_unique` (único): `token`
- `PRIMARY` (único): `id`

### `roles`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `department_id` | bigint(20) unsigned | sí | MUL | NULL |
| `name` | varchar(255) | no | — | — |
| `can_post_announcements` | tinyint(1) | no | — | 0 |
| `can_manage_department` | tinyint(1) | no | — | 0 |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `department_id` → `departments.id`

**Índices**

- `PRIMARY` (único): `id`
- `roles_department_id_name_unique` (único): `department_id,name`

### `users`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `department_id` | bigint(20) unsigned | sí | MUL | NULL |
| `es_lider` | tinyint(1) | no | — | 0 |
| `onboarding_pendiente` | tinyint(1) | no | — | 1 |
| `name` | varchar(255) | no | — | — |
| `email` | varchar(255) | no | UNI | — |
| `email_verified_at` | timestamp | sí | — | NULL |
| `password` | varchar(255) | no | — | — |
| `remember_token` | varchar(100) | sí | — | NULL |
| `created_at` | timestamp | sí | — | NULL |
| `updated_at` | timestamp | sí | — | NULL |

**Claves foráneas**

- `department_id` → `departments.id`

**Índices**

- `PRIMARY` (único): `id`
- `users_email_unique` (único): `email`

### `user_roles`

| Columna | Tipo | Nulo | Clave | Predeterminado |
| --- | --- | --- | --- | --- |
| `id` | bigint(20) unsigned | no | PRI | — (auto_increment) |
| `user_id` | bigint(20) unsigned | no | MUL | — |
| `role_id` | bigint(20) unsigned | no | MUL | — |

**Claves foráneas**

- `role_id` → `roles.id`
- `user_id` → `users.id`

**Índices**

- `PRIMARY` (único): `id`

## 3. Tablas del framework

Las crea Laravel y no son código de negocio:

| Tabla | Filas aprox. | Origen |
| --- | --- | --- |
| `cache` | 6 | Caché de la aplicación |
| `cache_locks` | 0 | Bloqueos del caché |
| `failed_jobs` | 0 | Colas de trabajo fallidas |
| `jobs` | 0 | Colas de trabajo pendientes |
| `job_batches` | 0 | Lotes de cola |
| `migrations` | 33 | Registro de migraciones aplicadas |
| `password_reset_tokens` | 0 | Tokens de recuperación de contraseña |
| `sessions` | 7 | Sesiones HTTP |

## 4. Relaciones principales

```
users ──┬── user_roles ──── roles ──── departments
        │                        │
        ├── department_user ─────┘
        │
        ├── personal_access_tokens        (tokens de Sanctum)
        │
        └── conversation_user ─── conversations ─── messages ─── message_reads
                                       │
                                       └── conversation_user

departments ──── department_folders ──── documents
announcements ─── announcement_attachments
announcements ─── comments
```

## 5. Migraciones

33 migraciones, todas en estado *Ran* (`php artisan migrate:status` sin pendientes). El esquema se reconstruye con `php artisan migrate:fresh --seed`.

| # | Migración | Tablas afectadas |
| --- | --- | --- |
| 1 | `0001_01_01_000000_create_users_table.php` | `password_reset_tokens`, `sessions`, `users` |
| 2 | `0001_01_01_000001_create_cache_table.php` | `cache`, `cache_locks` |
| 3 | `0001_01_01_000002_create_jobs_table.php` | `failed_jobs`, `job_batches`, `jobs` |
| 4 | `2026_04_06_192435_create_departments_table.php` | `departments` |
| 5 | `2026_04_06_192435_create_roles_table.php` | `roles` |
| 6 | `2026_04_06_192436_create_announcements_table.php` | `announcements` |
| 7 | `2026_04_06_192436_create_comments_table.php` | `comments` |
| 8 | `2026_04_06_192436_create_conversations_table.php` | `conversations` |
| 9 | `2026_04_06_192436_create_documents_table.php` | `documents` |
| 10 | `2026_04_06_192436_create_user_roles_table.php` | `user_roles` |
| 11 | `2026_04_06_192437_add_department_id_to_users_table.php` | `users` |
| 12 | `2026_04_06_192437_create_conversation_user_table.php` | `conversation_user` |
| 13 | `2026_04_06_192438_create_messages_table.php` | `messages` |
| 14 | `2026_04_06_192439_create_message_reads_table.php` | `message_reads` |
| 15 | `2026_04_06_195456_create_personal_access_tokens_table.php` | `personal_access_tokens` |
| 16 | `2026_04_06_500000_add_user_role_flags.php` | `users` |
| 17 | `2026_04_18_000001_create_department_folders_table.php` | `department_folders` |
| 18 | `2026_04_18_000002_add_folder_and_file_metadata_to_documents_table.php` | `documents` |
| 19 | `2026_04_18_000003_add_document_id_to_messages_table.php` | `messages` |
| 20 | `2026_04_18_000004_seed_postman_test_users.php` | — |
| 21 | `2026_04_18_000005_add_is_visible_to_announcements_table.php` | `announcements` |
| 22 | `2026_04_18_000006_create_announcement_attachments_table.php` | `announcement_attachments` |
| 23 | `2026_04_18_181936_create_comments_table.php` | — |
| 24 | `2026_04_18_182105_alter_comments_table_add_fields.php` | `comments` |
| 25 | `2026_04_20_000001_add_department_id_to_roles_table.php` | `roles` |
| 26 | `2026_04_20_000002_fix_comments_table_structure.php` | `comments` |
| 27 | `2026_10_06_000001_add_department_id_to_conversations_table.php` | `conversations` |
| 28 | `2026_10_06_000002_backfill_department_conversations.php` | — |
| 29 | `2026_10_06_000003_add_can_manage_department_to_roles_table.php` | `roles` |
| 30 | `2026_10_06_000004_add_soft_deletes_to_messages_and_documents.php` | `documents`, `messages` |
| 31 | `2026_10_19_000001_add_color_to_departments_table.php` | `departments` |
| 32 | `2026_11_08_000001_create_department_user_table.php` | `department_user` |
| 33 | `2026_11_09_000001_make_announcements_department_nullable.php` | `announcements` |

## 6. Convenciones del esquema

- **Borrado lógico.** `messages`, `announcements`, `comments` y `documents` usan `deleted_at`; el borrado real lo hace la Papelera (`/dashboard/trash`).
- **Timestamps.** Todas las tablas de dominio llevan `created_at` y `updated_at`; las tablas puente, solo `created_at`.
- **Claves.**.bigIncrements para las claves primarias y unsignedBigInteger con foreignId para las foráneas.
- **Visibilidad.** `announcements` y `documents` comparten el juego `public` / `department` / `private`; `department_id` nulo significa visibilidad general.
- **Una sola excepción a Eloquent.** `ConversationController` usa un `selectRaw` para agregar el contador de no leídos sobre `message_reads`.


---

Documento generado desde las fuentes del repositorio: el `.docx` de la Fase 2.1, el esquema real de MariaDB y las migraciones de Laravel. Su fuente canónica sigue siendo el `.docx`; este Markdown existe para que la trazabilidad sea consultable en el repositorio.
