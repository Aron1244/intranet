# Frontend graph

## Pages

| Path | File |
|---|---|
| `/p/dashboard/conversations` | `app/dashboard/conversations/page.tsx` |
| `/p/dashboard/departments` | `app/dashboard/departments/page.tsx` |
| `/p/dashboard/documents` | `app/dashboard/documents/page.tsx` |
| `/p/dashboard` | `app/dashboard/page.tsx` |
| `/p/dashboard/publications` | `app/dashboard/publications/page.tsx` |
| `/p/dashboard/roles` | `app/dashboard/roles/page.tsx` |
| `/p/dashboard/tasks` | `app/dashboard/tasks/page.tsx` |
| `/p/dashboard/trash` | `app/dashboard/trash/page.tsx` |
| `/p/dashboard/users` | `app/dashboard/users/page.tsx` |

## Components

| Component | File |
|---|---|
| `brand-mark` | `components/brand-mark.tsx` |
| `dashboard-header` | `components/dashboard-header.tsx` |
| `dashboard-sidebar` | `components/dashboard-sidebar.tsx` |
| `help-button` | `components/help-button.tsx` |
| `motion-primitives` | `components/motion-primitives.tsx` |
| `skeleton` | `components/skeleton.tsx` |
| `theme-provider` | `components/theme-provider.tsx` |
| `theme-toggle` | `components/theme-toggle.tsx` |

## External dependencies (npm)

`driver.js`, `framer-motion`, `laravel-echo`, `lucide-react`, `next`, `pusher-js`, `react`

## Internal dependency graph

```mermaid
graph LR
    app_@_components_brand_mark['brand-mark']
    app_@_components_motion_primitives['motion-primitives']
    app_@_components_theme_provider['theme-provider']
    app_@_lib_api_client['api-client']
    app_@_lib_auth_token['auth-token']
    app_@_lib_cn['cn']
    app_dashboard_@_components_dashboard_header['dashboard-header']
    app_dashboard_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_@_components_help_button['help-button']
    app_dashboard_@_components_motion_primitives['motion-primitives']
    app_dashboard_@_components_skeleton['skeleton']
    app_dashboard_@_lib_api_client['api-client']
    app_dashboard_@_lib_auth_token['auth-token']
    app_dashboard_@_lib_cn['cn']
    app_dashboard_@_lib_roles['roles']
    app_dashboard_conversations_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_conversations_@_components_help_button['help-button']
    app_dashboard_conversations_@_lib_api_client['api-client']
    app_dashboard_conversations_@_lib_auth_token['auth-token']
    app_dashboard_conversations_@_lib_echo_client['echo-client']
    app_dashboard_conversations_@_lib_roles['roles']
    app_dashboard_conversations_page_tsx['page']
    app_dashboard_departments_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_departments_@_lib_api_client['api-client']
    app_dashboard_departments_@_lib_auth_token['auth-token']
    app_dashboard_departments_@_lib_cn['cn']
    app_dashboard_departments_@_lib_roles['roles']
    app_dashboard_departments_page_tsx['page']
    app_dashboard_documents_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_documents_@_components_help_button['help-button']
    app_dashboard_documents_@_lib_api_client['api-client']
    app_dashboard_documents_@_lib_auth_token['auth-token']
    app_dashboard_documents_@_lib_roles['roles']
    app_dashboard_documents_page_tsx['page']
    app_dashboard_page_tsx['page']
    app_dashboard_publications_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_publications_@_components_help_button['help-button']
    app_dashboard_publications_@_lib_api_client['api-client']
    app_dashboard_publications_@_lib_auth_token['auth-token']
    app_dashboard_publications_@_lib_roles['roles']
    app_dashboard_publications_page_tsx['page']
    app_dashboard_tasks_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_tasks_@_lib_api_client['api-client']
    app_dashboard_tasks_@_lib_auth_token['auth-token']
    app_dashboard_tasks_@_lib_roles['roles']
    app_dashboard_tasks_page_tsx['page']
    app_dashboard_trash_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_trash_@_components_help_button['help-button']
    app_dashboard_trash_@_lib_api_client['api-client']
    app_dashboard_trash_@_lib_auth_token['auth-token']
    app_dashboard_trash_@_lib_cn['cn']
    app_dashboard_trash_@_lib_roles['roles']
    app_dashboard_trash_page_tsx['page']
    app_dashboard_users_@_components_dashboard_sidebar['dashboard-sidebar']
    app_dashboard_users_@_lib_api_client['api-client']
    app_dashboard_users_@_lib_auth_token['auth-token']
    app_dashboard_users_@_lib_cn['cn']
    app_dashboard_users_@_lib_roles['roles']
    app_dashboard_users_page_tsx['page']
    app_layout_tsx['layout']
    app_page_tsx['page']
    components_@_components_brand_mark['brand-mark']
    components_@_components_theme_provider['theme-provider']
    components_@_components_theme_toggle['theme-toggle']
    components_@_lib_auth_token['auth-token']
    components_@_lib_cn['cn']
    components_@_lib_help_tours['help-tours']
    components_brand_mark_tsx['brand-mark']
    components_dashboard_header_tsx['dashboard-header']
    components_dashboard_sidebar_tsx['dashboard-sidebar']
    components_help_button_tsx['help-button']
    components_skeleton_tsx['skeleton']
    components_theme_toggle_tsx['theme-toggle']
    lib_@_lib_auth_token['auth-token']
    lib_api_client_ts['api-client']
    lib_echo_client_ts['echo-client']
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_components_dashboard_sidebar
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_components_help_button
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_lib_api_client
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_lib_auth_token
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_lib_echo_client
    app_dashboard_conversations_page_tsx --> app_dashboard_conversations_@_lib_roles
    app_dashboard_departments_page_tsx --> app_dashboard_departments_@_components_dashboard_sidebar
    app_dashboard_departments_page_tsx --> app_dashboard_departments_@_lib_api_client
    app_dashboard_departments_page_tsx --> app_dashboard_departments_@_lib_auth_token
    app_dashboard_departments_page_tsx --> app_dashboard_departments_@_lib_cn
    app_dashboard_departments_page_tsx --> app_dashboard_departments_@_lib_roles
    app_dashboard_documents_page_tsx --> app_dashboard_documents_@_components_dashboard_sidebar
    app_dashboard_documents_page_tsx --> app_dashboard_documents_@_components_help_button
    app_dashboard_documents_page_tsx --> app_dashboard_documents_@_lib_api_client
    app_dashboard_documents_page_tsx --> app_dashboard_documents_@_lib_auth_token
    app_dashboard_documents_page_tsx --> app_dashboard_documents_@_lib_roles
    app_dashboard_page_tsx --> app_dashboard_@_components_dashboard_header
    app_dashboard_page_tsx --> app_dashboard_@_components_dashboard_sidebar
    app_dashboard_page_tsx --> app_dashboard_@_components_help_button
    app_dashboard_page_tsx --> app_dashboard_@_components_motion_primitives
    app_dashboard_page_tsx --> app_dashboard_@_components_skeleton
    app_dashboard_page_tsx --> app_dashboard_@_lib_api_client
    app_dashboard_page_tsx --> app_dashboard_@_lib_auth_token
    app_dashboard_page_tsx --> app_dashboard_@_lib_cn
    app_dashboard_page_tsx --> app_dashboard_@_lib_roles
    app_dashboard_publications_page_tsx --> app_dashboard_publications_@_components_dashboard_sidebar
    app_dashboard_publications_page_tsx --> app_dashboard_publications_@_components_help_button
    app_dashboard_publications_page_tsx --> app_dashboard_publications_@_lib_api_client
    app_dashboard_publications_page_tsx --> app_dashboard_publications_@_lib_auth_token
    app_dashboard_publications_page_tsx --> app_dashboard_publications_@_lib_roles
    app_dashboard_tasks_page_tsx --> app_dashboard_tasks_@_components_dashboard_sidebar
    app_dashboard_tasks_page_tsx --> app_dashboard_tasks_@_lib_api_client
    app_dashboard_tasks_page_tsx --> app_dashboard_tasks_@_lib_auth_token
    app_dashboard_tasks_page_tsx --> app_dashboard_tasks_@_lib_roles
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_components_dashboard_sidebar
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_components_help_button
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_lib_api_client
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_lib_auth_token
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_lib_cn
    app_dashboard_trash_page_tsx --> app_dashboard_trash_@_lib_roles
    app_dashboard_users_page_tsx --> app_dashboard_users_@_components_dashboard_sidebar
    app_dashboard_users_page_tsx --> app_dashboard_users_@_lib_api_client
    app_dashboard_users_page_tsx --> app_dashboard_users_@_lib_auth_token
    app_dashboard_users_page_tsx --> app_dashboard_users_@_lib_cn
    app_dashboard_users_page_tsx --> app_dashboard_users_@_lib_roles
    app_layout_tsx --> app_@_components_theme_provider
    app_page_tsx --> app_@_components_brand_mark
    app_page_tsx --> app_@_components_motion_primitives
    app_page_tsx --> app_@_lib_api_client
    app_page_tsx --> app_@_lib_auth_token
    app_page_tsx --> app_@_lib_cn
    components_brand_mark_tsx --> components_@_lib_cn
    components_dashboard_header_tsx --> components_@_components_brand_mark
    components_dashboard_header_tsx --> components_@_components_theme_toggle
    components_dashboard_header_tsx --> components_@_lib_cn
    components_dashboard_sidebar_tsx --> components_@_components_brand_mark
    components_dashboard_sidebar_tsx --> components_@_components_theme_toggle
    components_dashboard_sidebar_tsx --> components_@_lib_auth_token
    components_dashboard_sidebar_tsx --> components_@_lib_cn
    components_help_button_tsx --> components_@_lib_cn
    components_help_button_tsx --> components_@_lib_help_tours
    components_skeleton_tsx --> components_@_lib_cn
    components_theme_toggle_tsx --> components_@_components_theme_provider
    components_theme_toggle_tsx --> components_@_lib_cn
    lib_api_client_ts --> lib_@_lib_auth_token
    lib_echo_client_ts --> lib_@_lib_auth_token
```