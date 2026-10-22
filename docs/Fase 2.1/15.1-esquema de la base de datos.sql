-- =============================================================================
-- Coherev Intranet — esquema MariaDB consolidado
-- =============================================================================
-- Generado a partir de las migraciones de Laravel en backend/database/migrations
-- y los modelos Eloquent en backend/app/Models, ambos en revisión al 2026-10-05.
--
-- Notas de adaptación desde MySQL/MariaDB:
--   * Motor InnoDB (transacciones + FK).
--   * Charset utf8mb4 + colación utf8mb4_unicode_ci (config/database.php).
--   * BOOLEAN de Laravel → TINYINT(1). ENUM soportado nativamente.
--   * morphs() de Laravel → (parent_id BIGINT UNSIGNED + parent_type VARCHAR)
--     con índice compuesto.
--   * Las claves foráneas se nombran con el convenio Laravel
--     <tabla>_<columna>_foreign.
--
-- Orden de aplicación:
--   Las FK se declaran inline dentro de CREATE TABLE. Si tu MariaDB tiene
--   foreign_key_checks=1 y necesitas reimportar, envuelve el bloque en:
--         SET FOREIGN_KEY_CHECKS = 0;
--         ... script ...
--         SET FOREIGN_KEY_CHECKS = 1;
--
-- Diagrama entidad-relación: ver docs/ER-diagram.pdf
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Usuarios + autenticación
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                     VARCHAR(255)    NOT NULL,
    email                    VARCHAR(255)    NOT NULL,
    email_verified_at        TIMESTAMP       NULL,
    password                 VARCHAR(255)    NOT NULL,
    department_id            BIGINT UNSIGNED NULL,
    es_lider                 TINYINT(1)      NOT NULL DEFAULT 0,
    onboarding_pendiente     TINYINT(1)      NOT NULL DEFAULT 1,
    remember_token           VARCHAR(100)    NULL,
    created_at               TIMESTAMP       NULL,
    updated_at               TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY users_email_unique (email),
    KEY users_department_id_index (department_id),
    CONSTRAINT users_department_id_foreign
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email        VARCHAR(255) NOT NULL,
    token        VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP    NULL,
    PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id            VARCHAR(255) NOT NULL,
    user_id       BIGINT UNSIGNED NULL,
    ip_address    VARCHAR(45)  NULL,
    user_agent    TEXT         NULL,
    payload       LONGTEXT     NOT NULL,
    last_activity INT          NOT NULL,
    PRIMARY KEY (id),
    KEY sessions_user_id_index (user_id),
    KEY sessions_last_activity_index (last_activity),
    CONSTRAINT sessions_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tokenable_type    VARCHAR(255)    NOT NULL,
    tokenable_id      BIGINT UNSIGNED NOT NULL,
    name              TEXT            NOT NULL,
    token             VARCHAR(64)     NOT NULL,
    abilities         TEXT            NULL,
    last_used_at      TIMESTAMP       NULL,
    expires_at        TIMESTAMP       NULL,
    created_at        TIMESTAMP       NULL,
    updated_at        TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY personal_access_tokens_token_unique (token),
    KEY personal_access_tokens_tokenable_index (tokenable_type, tokenable_id),
    KEY personal_access_tokens_expires_at_index (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Departamentos y carpetas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255)    NOT NULL,
    description   VARCHAR(255)    NULL,
    created_at    TIMESTAMP       NULL,
    updated_at    TIMESTAMP       NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_folders (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    department_id BIGINT UNSIGNED NOT NULL,
    parent_id     BIGINT UNSIGNED NULL,
    created_by    BIGINT UNSIGNED NOT NULL,
    name          VARCHAR(255)    NOT NULL,
    created_at    TIMESTAMP       NULL,
    updated_at    TIMESTAMP       NULL,
    PRIMARY KEY (id),
    KEY department_folders_department_id_parent_id_index (department_id, parent_id),
    UNIQUE KEY department_folders_department_id_parent_id_name_unique
        (department_id, parent_id, name),
    CONSTRAINT department_folders_department_id_foreign
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT department_folders_parent_id_foreign
        FOREIGN KEY (parent_id) REFERENCES department_folders (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT department_folders_created_by_foreign
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Roles + relación N:M con usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                     VARCHAR(255)    NOT NULL,
    can_post_announcements    TINYINT(1)      NOT NULL DEFAULT 0,
    department_id            BIGINT UNSIGNED NULL,
    created_at               TIMESTAMP       NULL,
    updated_at               TIMESTAMP       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY roles_department_id_name_unique (department_id, name),
    CONSTRAINT roles_department_id_foreign
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id   BIGINT UNSIGNED NOT NULL,
    role_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT user_roles_role_id_foreign
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Anuncios + comentarios + adjuntos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title         VARCHAR(255)    NOT NULL,
    content       TEXT            NOT NULL,
    is_visible    TINYINT(1)      NOT NULL DEFAULT 0,
    department_id BIGINT UNSIGNED NOT NULL,
    created_by    BIGINT UNSIGNED NOT NULL,
    created_at    TIMESTAMP       NULL,
    updated_at    TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT announcements_department_id_foreign
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT announcements_created_by_foreign
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    announcement_id BIGINT UNSIGNED NOT NULL,
    content         TEXT            NOT NULL,
    created_at      TIMESTAMP       NULL,
    updated_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT comments_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT comments_announcement_id_foreign
        FOREIGN KEY (announcement_id) REFERENCES announcements (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcement_attachments (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    announcement_id BIGINT UNSIGNED NOT NULL,
    user_id        BIGINT UNSIGNED NOT NULL,
    file_path      VARCHAR(255)    NOT NULL,
    original_name  VARCHAR(255)    NOT NULL,
    mime_type      VARCHAR(150)    NULL,
    size_bytes     BIGINT UNSIGNED NULL,
    created_at     TIMESTAMP       NULL,
    updated_at     TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT announcement_attachments_announcement_id_foreign
        FOREIGN KEY (announcement_id) REFERENCES announcements (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT announcement_attachments_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Conversaciones + mensajes + lecturas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)    NULL,
    type        ENUM('private','group') NOT NULL,
    created_at  TIMESTAMP       NULL,
    updated_at  TIMESTAMP       NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversation_user (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP       NULL,
    updated_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT conversation_user_conversation_id_foreign
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT conversation_user_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Documentos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title                VARCHAR(255)    NOT NULL,
    file_path            VARCHAR(255)    NOT NULL,
    original_name        VARCHAR(255)    NULL,
    mime_type            VARCHAR(255)    NULL,
    size_bytes           BIGINT UNSIGNED NULL,
    user_id              BIGINT UNSIGNED NOT NULL,
    department_folder_id BIGINT UNSIGNED NULL,
    visibility           ENUM('public','department','private') NOT NULL,
    created_at           TIMESTAMP       NULL,
    updated_at           TIMESTAMP       NULL,
    PRIMARY KEY (id),
    KEY documents_department_folder_id_index (department_folder_id),
    CONSTRAINT documents_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT documents_department_folder_id_foreign
        FOREIGN KEY (department_folder_id) REFERENCES department_folders (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id       BIGINT UNSIGNED NOT NULL,
    content         TEXT            NOT NULL,
    document_id     BIGINT UNSIGNED NULL,
    type            VARCHAR(255)    NOT NULL DEFAULT 'text',
    created_at      TIMESTAMP       NULL,
    updated_at      TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT messages_conversation_id_foreign
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT messages_sender_id_foreign
        FOREIGN KEY (sender_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT messages_document_id_foreign
        FOREIGN KEY (document_id) REFERENCES documents (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_reads (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    message_id  BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    read_at     TIMESTAMP       NULL,
    PRIMARY KEY (id),
    CONSTRAINT message_reads_message_id_foreign
        FOREIGN KEY (message_id) REFERENCES messages (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT message_reads_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tablas del framework Laravel (cache + colas)
-- Se incluyen para paridad 1:1 con las migraciones originales.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache (
    `key`       VARCHAR(255) NOT NULL,
    `value`     MEDIUMTEXT   NOT NULL,
    expiration  BIGINT       NOT NULL,
    PRIMARY KEY (`key`),
    KEY cache_expiration_index (expiration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cache_locks (
    `key`       VARCHAR(255) NOT NULL,
    owner       VARCHAR(255) NOT NULL,
    expiration  BIGINT       NOT NULL,
    PRIMARY KEY (`key`),
    KEY cache_locks_expiration_index (expiration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    queue         VARCHAR(255)    NOT NULL,
    payload       LONGTEXT        NOT NULL,
    attempts      TINYINT UNSIGNED NOT NULL,
    reserved_at   INT UNSIGNED    NULL,
    available_at  INT UNSIGNED    NOT NULL,
    created_at    INT UNSIGNED    NOT NULL,
    PRIMARY KEY (id),
    KEY jobs_queue_index (queue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_batches (
    id              VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    total_jobs      INT          NOT NULL,
    pending_jobs    INT          NOT NULL,
    failed_jobs     INT          NOT NULL,
    failed_job_ids  LONGTEXT     NOT NULL,
    options         MEDIUMTEXT   NULL,
    cancelled_at    INT          NULL,
    created_at      INT          NOT NULL,
    finished_at     INT          NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS failed_jobs (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    uuid        VARCHAR(255)    NOT NULL,
    connection  TEXT            NOT NULL,
    queue       TEXT            NOT NULL,
    payload     LONGTEXT        NOT NULL,
    exception   LONGTEXT        NOT NULL,
    failed_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY failed_jobs_uuid_unique (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla de control de migraciones de Laravel (si vas a reusar `artisan migrate`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration VARCHAR(255) NOT NULL,
    batch     INT          NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Datos semilla mínimos para desarrollo (los 4 roles canónicos de Coherev).
-- Las contraseñas son Argon2id / Bcrypt — cámbialas antes de cualquier despliegue.
-- =============================================================================
-- INSERT INTO departments (id, name, description, created_at, updated_at) VALUES
--     (1, 'Administración', 'Departamento administrativo',            NOW(), NOW()),
--     (2, 'Tecnología',     'Departamento de tecnología',            NOW(), NOW()),
--     (3, 'Operaciones',    'Departamento de operaciones',           NOW(), NOW());
--
-- INSERT INTO roles (id, name, can_post_announcements, department_id, created_at, updated_at) VALUES
--     (1, 'Administrador',   1, NULL, NOW(), NOW()),
--     (2, 'Líder',           1, NULL, NOW(), NOW()),
--     (3, 'Colaborador',     0, NULL, NOW(), NOW()),
--     (4, 'Nuevo Ingreso',   0, NULL, NOW(), NOW());
-- =============================================================================