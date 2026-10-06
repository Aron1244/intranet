# Graph Report - intranet  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1080 nodes · 2364 edges · 96 communities (43 shown, 53 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `42e46ba2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Illuminate\Foundation\Http\FormRequest
- User
- theme-provider.tsx
- documents/page.tsx
- Message
- conversations/page.tsx
- Role
- Illuminate\Database\Eloquent\Relations\BelongsTo
- TestCase
- Illuminate\Http\JsonResponse
- Conversation
- departments/page.tsx
- dashboard/page.tsx
- DemoDataSeeder
- publications/page.tsx
- cn
- compilerOptions
- Department
- Illuminate\Database\Schema\Blueprint
- app/page.tsx
- Document
- UserController.php
- Illuminate\Http\Request
- RoleController
- 2026_04_18_000004_seed_postman_test_users.php
- api.php
- UserAuthorizationTest
- trash/page.tsx
- DepartmentFolder
- frontend/package.json
- bootstrap/app.php
- Illuminate\Database\Migrations\Migration
- backend/package.json
- DocumentAuthorizationTest
- DemoDataSeederTest
- CanManageAnnouncementsCentralizedTest
- MimeValidationTest
- Illuminate\Support\Facades\Schema
- RoleSeeder
- DocumentController.php
- AppServiceProvider.php
- composer.json
- scripts
- devDependencies
- dependencies
- devDependencies
- require-dev
- config
- laravel-boost
- .uploadDocument
- .store
- require
- 0001_01_01_000000_create_users_table.php
- 0001_01_01_000002_create_jobs_table.php
- psr-4
- 0001_01_01_000001_create_cache_table.php
- 2026_04_06_192437_add_department_id_to_users_table.php
- 2026_04_06_500000_add_user_role_flags.php
- 2026_04_18_000003_add_document_id_to_messages_table.php
- 2026_04_18_182105_alter_comments_table_add_fields.php
- 2026_04_20_000001_add_department_id_to_roles_table.php
- 2026_04_20_000002_fix_comments_table_structure.php
- 2026_10_06_000001_add_department_id_to_conversations_table.php
- 2026_10_06_000003_add_can_manage_department_to_roles_table.php
- scripts
- 2026_04_06_192435_create_departments_table.php
- 2026_04_06_192436_create_announcements_table.php
- 2026_04_06_192436_create_comments_table.php
- 2026_04_06_192436_create_conversations_table.php
- 2026_04_06_192436_create_documents_table.php
- 2026_04_06_192436_create_user_roles_table.php
- 2026_04_06_192438_create_messages_table.php
- 2026_04_06_192439_create_message_reads_table.php
- 2026_04_18_000001_create_department_folders_table.php
- 2026_04_18_000006_create_announcement_attachments_table.php
- ExampleTest
- autoload-dev
- extra
- scripts
- bootstrap.js
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `User` - 101 edges
2. `Department` - 68 edges
3. `Role` - 58 edges
4. `Document` - 44 edges
5. `Announcement` - 37 edges
6. `Message` - 34 edges
7. `Conversation` - 32 edges
8. `TestCase` - 30 edges
9. `cn()` - 29 edges
10. `Controller` - 27 edges

## Surprising Connections (you probably didn't know these)
- `down()` --calls--> `User`  [EXTRACTED]
  backend/database/migrations/2026_04_18_000004_seed_postman_test_users.php → backend/app/Models/User.php
- `{closure#5}()` --references--> `Document`  [EXTRACTED]
  backend/app/Http/Controllers/Api/DocumentController.php → backend/app/Models/Document.php
- `CommentController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Api/CommentController.php → backend/app/Http/Controllers/Controller.php
- `CommentController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/CommentController.php → backend/app/Http/Controllers/Controller.php
- `{closure#1}()` --references--> `Announcement`  [EXTRACTED]
  backend/app/Http/Controllers/Api/AnnouncementController.php → backend/app/Models/Announcement.php

## Import Cycles
- None detected.

## Communities (96 total, 53 thin omitted)

### Community 0 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.06
Nodes (12): CommentController, CommentController, CommentRequest, RejectsMimeMismatch, LoginRequest, StoreAnnouncementRequest, StoreCommentRequest, StoreDocumentRequest (+4 more)

### Community 1 - "User"
Cohesion: 0.08
Nodes (8): Announcement, User, AnnouncementPolicy, {closure#3}(), {closure#4}(), {closure#5}(), AnnouncementAuthorizationTest, UserRoleFlagsTest

### Community 2 - "theme-provider.tsx"
Cohesion: 0.05
Nodes (33): ErrorPageProps, geistMono, geistSans, metadata, RootLayout(), viewport, emitChange(), getServerSnapshot() (+25 more)

### Community 3 - "documents/page.tsx"
Cohesion: 0.11
Nodes (36): DocumentItem, DocumentsPage(), DocumentsResponse, DocumentsViewMode, formatFileSize(), getOriginLabel(), getVisibilityLabel(), MeResponse (+28 more)

### Community 4 - "Message"
Cohesion: 0.13
Nodes (4): MessageSent, {closure#1}(), Message, MessageReadTest

### Community 5 - "conversations/page.tsx"
Cohesion: 0.11
Nodes (22): AppUser, BackendMessage, ChatMessage, ChatSyncEvent, Conversation, ConversationsPage(), Department, DocumentAttachment (+14 more)

### Community 6 - "Role"
Cohesion: 0.17
Nodes (3): Role, RoleAuthorizationTest, RoleSeederTest

### Community 7 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.13
Nodes (3): {closure#2}(), AnnouncementAttachment, MessageRead

### Community 8 - "TestCase"
Cohesion: 0.14
Nodes (4): CommentTest, ExampleTest, LoginRateLimitTest, TestCase

### Community 9 - "Illuminate\Http\JsonResponse"
Cohesion: 0.17
Nodes (5): AnnouncementController, {closure#1}(), AuthController, UserRoleController, Controller

### Community 10 - "Conversation"
Cohesion: 0.12
Nodes (4): {closure#1}(), DepartmentController, Conversation, up()

### Community 11 - "departments/page.tsx"
Cohesion: 0.14
Nodes (21): CheckboxField(), CheckboxFieldProps, Department, DepartmentFormState, DepartmentsPage(), EmptyState(), Field(), FieldProps (+13 more)

### Community 12 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (21): Announcement, BackendMessage, ChatSkeleton(), Conversation, DashboardPage(), EmptyState(), FeedCard(), FeedHeader() (+13 more)

### Community 14 - "publications/page.tsx"
Cohesion: 0.13
Nodes (17): Announcement, AnnouncementAttachment, AnnouncementFormState, DepartmentOption, DepartmentsResponse, formatRelativeTime(), INITIAL_FORM_STATE, makePreviewText() (+9 more)

### Community 15 - "cn"
Cohesion: 0.22
Nodes (14): BrandMark(), DashboardHeader(), MobileNav(), NAV_ITEMS, NavItem, SidebarProps, SidebarState, SidebarUser (+6 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "Illuminate\Database\Schema\Blueprint"
Cohesion: 0.16
Nodes (8): {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}()

### Community 19 - "app/page.tsx"
Cohesion: 0.20
Nodes (16): BackdropDecor(), BrandPanel(), Field(), FieldProps, highlights, Home(), LaravelValidationErrorPayload, LoginResponse (+8 more)

### Community 20 - "Document"
Cohesion: 0.18
Nodes (3): {closure#2}(), Document, DocumentPolicy

### Community 21 - "UserController.php"
Cohesion: 0.18
Nodes (4): UserController, StoreUserRequest, UpdateUserRequest, UserResource

### Community 23 - "RoleController"
Cohesion: 0.17
Nodes (3): RoleController, UpdateRoleRequest, RoleResource

### Community 24 - "2026_04_18_000004_seed_postman_test_users.php"
Cohesion: 0.14
Nodes (3): UserFactory, down(), up()

### Community 27 - "trash/page.tsx"
Cohesion: 0.21
Nodes (14): EmptyTrash(), Filter, FilterChip(), formatBytes(), formatDateTime(), MeResponse, TrashDocument, TrashItem() (+6 more)

### Community 28 - "DepartmentFolder"
Cohesion: 0.17
Nodes (3): DocumentController, UpdateDocumentRequest, DepartmentFolder

### Community 30 - "frontend/package.json"
Cohesion: 0.15
Nodes (12): eslintConfig, name, private, version, eslint, eslint-config-next, react-dom, @tailwindcss/postcss (+4 more)

### Community 31 - "bootstrap/app.php"
Cohesion: 0.21
Nodes (4): AdminOnly, {closure#1}(), {closure#2}(), {closure#3}()

### Community 33 - "backend/package.json"
Cohesion: 0.20
Nodes (10): laravel-echo, pusher-js, tailwindcss, private, $schema, type, concurrently, laravel-vite-plugin (+2 more)

### Community 42 - "composer.json"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 43 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 44 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, axios, concurrently, laravel-echo, laravel-vite-plugin, pusher-js, tailwindcss, @tailwindcss/vite (+1 more)

### Community 45 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, driver.js, framer-motion, laravel-echo, lucide-react, next, pusher-js, react (+1 more)

### Community 46 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

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

### Community 68 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 82 - "autoload-dev"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 83 - "extra"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

### Community 84 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, build, dev

## Knowledge Gaps
- **199 isolated node(s):** `CheckboxFieldProps`, `Department`, `DepartmentFormState`, `FieldProps`, `MeResponse` (+194 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 366 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Message`, `Role`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `TestCase`, `Illuminate\Http\JsonResponse`, `Conversation`, `DemoDataSeeder`, `Department`, `Document`, `UserController.php`, `Illuminate\Http\Request`, `RoleController`, `2026_04_18_000004_seed_postman_test_users.php`, `UserAuthorizationTest`, `Illuminate\Database\Eloquent\Relations\HasMany`, `DocumentAuthorizationTest`, `DemoDataSeederTest`, `CanManageAnnouncementsCentralizedTest`, `MimeValidationTest`, `RoleSeeder`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **What connects `CheckboxFieldProps`, `Department`, `DepartmentFormState` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Illuminate\Foundation\Http\FormRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.05844155844155844 - nodes in this community are weakly interconnected._
- **Why does `Department` connect `Department` to `User`, `DocumentAuthorizationTest`, `DemoDataSeederTest`, `MimeValidationTest`, `Illuminate\Support\Facades\Schema`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `DocumentController.php`, `Illuminate\Http\JsonResponse`, `Conversation`, `TestCase`, `Role`, `DemoDataSeeder`, `.uploadDocument`, `RoleController`, `2026_04_18_000004_seed_postman_test_users.php`, `UserAuthorizationTest`, `DepartmentFolder`, `Illuminate\Database\Eloquent\Relations\HasMany`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.08048103607770583 - nodes in this community are weakly interconnected._
- **Why does `Role` connect `Role` to `User`, `DocumentAuthorizationTest`, `DemoDataSeederTest`, `CanManageAnnouncementsCentralizedTest`, `MimeValidationTest`, `Illuminate\Support\Facades\Schema`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `RoleSeeder`, `Illuminate\Http\JsonResponse`, `TestCase`, `DemoDataSeeder`, `Department`, `RoleController`, `2026_04_18_000004_seed_postman_test_users.php`, `UserAuthorizationTest`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `theme-provider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05410628019323672 - nodes in this community are weakly interconnected._