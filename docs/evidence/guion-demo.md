# Guion de la demo en vivo — Coherev

| Campo | Detalle |
| --- | --- |
| Duración | 20 minutos |
| Participantes | Benjamín Herrera (backend) y Julián Tapia (frontend), docente guía |
| Objetivo | Demostrar los 7 módulos operativos sobre datos reales y responder sobre cada verificación del checklist |
| Estado | [ ] Pendiente de ejecución — se completa `acta-demo.md` el día de la sesión |

---

## Antes de empezar

| # | Paso | Verificación |
| --- | --- | --- |
| 1 | `php artisan migrate:fresh --seed` | 33 migraciones aplicadas, 300 usuarios de demostración |
| 2 | `php artisan serve --port=8000` | `http://127.0.0.1:8000/up` responde 200 |
| 3 | `php artisan reverb:start --port=8080` | Escucha en `ws://localhost:8080` |
| 4 | `npm run build` en `frontend/` | Compila sin errores |
| 5 | `npm run dev` en `frontend/` | `http://localhost:3000` carga el login |
| 6 | Abrir dos ventanas: una con Administrador y otra con Colaborador | Sirve para comparar el sidebar por rol |

**Usuarios de prueba**

| Perfil | Correo | Contraseña | Rol |
| --- | --- | --- | --- |
| Administrador | `postman.admin@test.local` | `Admin123!` | Administrador |
| Colaborador | `postman.user@test.local` | `User123!` | Colaborador |

### Decisión pendiente antes de la demo: el chat en vivo

La entrega de mensajes en tiempo real **no funciona**: el frontend se suscribe al canal `conversations.{id}` mientras el backend emite y autoriza `conversation.{id}`, y la ruta `POST /broadcasting/auth` responde 403 porque resuelve el usuario con el guard `web` en vez de `sanctum` (DEF-032 y DEF-033, §1.1 y §7.1 del checklist).

Hay dos caminos y conviene decidirlo con tiempo:

- **Corregir los dos defectos antes de la demo.** Es lo recomendable: son cambios acotados (unificar el nombre del canal en backend, frontend y README; registrar el canal de broadcast con el guard `sanctum`) y permiten cerrar RF-CHT-06 y RF-CHT-07 como cumplidos.
- **No corregirlos y recorrer el chat en modo degradado.** El historial, el envío y el contador de no leídos funcionan; lo que no se entrega es el mensaje en vivo. En ese caso, el bloque 4 del guion se demuestra como «persistencia sin entrega instantánea» y se dice en voz alta, que es lo honesto.

---

## 1. Apertura — qué es Coherev (0:00 – 0:02)

**Qué se muestra.** La pantalla de login con la marca de Coherev y el lema «Portal interno de gestión, comunicación y herramientas del equipo».

**Qué se dice.** Coherev reúne en un solo lugar la comunicación interna, el contenido de la organización, la gestión documental y el control de acceso por rol. Siete módulos operativos de los diez previstos.

**Qué se verifica.** Identidad de marca, coherencia con la voz de la marca (`VOICE_TONE.md`).

---

## 2. Autenticación y sesión (0:02 – 0:05)

**Acciones.**

1. Entrar como `postman.admin@test.local`. Mostrar que la sesión queda validada (pie con nombre y correo, secciones visibles de Administrador).
2. Marcar «Mantener sesión iniciada» en un segundo ingreso, recargar y mostrar que la sesión persiste.
3. Intentar el login con una contraseña incorrecta: el mensaje es genérico, no dice si el correo existe.
4. Intentar entrar a `http://localhost:3000/dashboard` sin sesión: redirige al login.

**Qué se verifica.** RF-AUT-01 a RF-AUT-08 · RNF-SEG-02, RNF-SEG-03, RNF-SEG-09 · RNF-DISP-05 · casos CP-001 a CP-010.

**Si algo falla.** El rate limit (5 intentos por minuto, respuesta 429) se puede demostrar a propósito; es mejor mostrarlo que esconderlo.

---

## 3. Roles y permisos (0:05 – 0:08)

**Acciones.**

1. Con el Administrador: abrir Usuarios, Departamentos y Roles. Son secciones que el Colaborador no ve.
2. Cambiar al Colaborador: el sidebar pierde Usuarios y Papelera; Publicaciones solo aparece si el usuario tiene `can_post_announcements`.
3. Con el Colaborador, intentar crear un usuario por la API: la respuesta es 403, no 500.

**Qué se verifica.** RF-USR-01 y RF-USR-05 · RF-ROL-02, RF-ROL-04 y RF-ROL-05 · RNF-SEG-04 · casos CP-011, CP-013 y CP-029.

**Dato que conviene tener a mano.** La autorización no se implementa en el frontend: cada ruta protegida lleva `auth:sanctum` y las sensibles, middleware `admin` y Policies. Cambiar el rol en la interfaz cambia los permisos reales porque el backend los vuelve a validar.

---

## 4. Departamentos, carpetas y documentos (0:08 – 0:12)

**Acciones.**

1. Departamentos: mostrar la lista con su color, crear uno como Administrador y comprobar que el Líder no ve los botones de edición.
2. Abrir un departamento, ver sus carpetas documentales y subir un documento.
3. Cambiar al Colaborador: solo ve los documentos públicos y los de su departamento; la descarga de un documento ajeno responde 403.

**Qué se verifica.** RF-DEP-01 a RF-DEP-04 · RF-DOC-01 a RF-DOC-05 · RNF-SEG-05, RNF-SEG-06 · casos CP-012, CP-014, CP-025 y CP-026.

**Punto fuerte para la conversación.** El MIME se valida leyendo el contenido real del archivo, no por su extensión: un `.php` renombrado a `.png` se rechaza con 415.

---

## 5. Publicaciones y comentarios (0:12 – 0:16)

**Acciones.**

1. Como Colaborador: ver el feed del dashboard y que las publicaciones muestran imagen y cuerpo completo.
2. Crear una publicación con un archivo adjunto, en modo general y en modo departamental.
3. Comentar la publicación de otro departamento y comprobar que responde 403.
4. Como Administrador: editar y eliminar una publicación ajena, que un Colaborador no puede.

**Qué se verifica.** RF-PUB-01 a RF-PUB-07 · RNF-REN-01 · casos CP-021 a CP-024 y CP-030.

**Dato que conviene tener a mano.** La visibilidad tiene tres niveles (`public`, `department`, `private`) y `department_id` nulo significa publicación general para toda la organización.

---

## 6. Chat y papelera (0:16 – 0:18)

**Acciones.**

1. Abrir una conversación existente y enviar un mensaje: el historial se carga y el mensaje queda persistido.
2. Marcar la conversación como leída y comprobar que el contador de no leídos baja.
3. En Papelera: enviar a la papelera un documento y restaurarlo.

**Qué se verifica.** RF-CHT-01, RF-CHT-03, RF-CHT-04, RF-CHT-08, RF-CHT-09 · RNF-MANT-03 · casos CP-015, CP-017, CP-019 y CP-027.

**Advertencia.** Según la decisión tomada antes de la demo, este bloque puede no incluir la entrega en vivo (DEF-032 y DEF-033). Si se incluye y falla, es el defecto conocido y documentado, no un fallo del improviso.

---

## 7. Onboarding y cierre (0:18 – 0:20)

**Acciones.**

1. Entrar como un usuario nuevo y dejar que aparezca el tour guiado: avanzar, retroceder y cerrar.
2. Resumir en voz alta: siete módulos operativos de diez, 133 pruebas automatizadas en verde y qué queda pendiente (Tareas, Directorio y Novedades).

**Qué se verifica.** RNF-UXA-04 · caso CP-031.

---

## Notas para la mesa

- **Las métricas del proyecto no se demuestran en la demo**: NSM, WAU y el tiempo hasta el primer mensaje salen de la tabla de lecturas y de mensajes y necesitan usuarios reales durante días. Salen del acta de usabilidad (§4 del índice de la carpeta), no de una demostración.
- **Lo que se demuestra con datos reales**: los 300 usuarios, 8 departamentos y 32 publicaciones del seeder, más los documentos y conversaciones generados.
- **Si preguntan por los tres módulos faltantes**: la respuesta es que están identificados como MOD-001, MOD-002 y MOD-003 en el backlog y son el único incumplimiento abierto del alcance, con dos opciones reales: implementarlos o declararlos fuera de alcance con el aval de la docente guía. No hay una tercera respuesta comfortable, y conviene decirlo así.
- **Si preguntan por la falta de tests de frontend o E2E**: es la brecha real y conocida del proyecto. Está registrada como riesgo R5 y como la prioridad argumentada en `docs/PREGUNTAS-EVALUACION-RESPUESTAS.md`.
