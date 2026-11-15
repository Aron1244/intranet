# Voz y tono de Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Entregable | Voz y tono de la marca, glosario y reescritura de errores |
| Versión | 1.0 — 15 de noviembre de 2026 |
| Tarjeta | BRAND-007 (Voice & tone + microcopy) |
| Integrantes | Benjamín Herrera (Backend) / Julián Tapia (Frontend) |
| Docente guía | Cindy Betzabé Contador Cisterna |

---

## 1. Qué es Coherev

Coherev es el portal interno de gestión, comunicación y herramientas del equipo. Reúne en un solo lugar la comunicación interna, el contenido de la organización, la gestión documental y el control de acceso por rol.

La marca es **cercana, sobria y directa**. Habla a colegas de la misma organización, no a un público masivo: sabe de qué se trata, no necesita explicarlo y no usa Momentum.

---

## 2. Principios de la voz

1. **Primero la persona, después el sistema.** «No se pudo enviar el mensaje» antes que «Error 500». El usuario no ve códigos HTTP salvo que sean la única información útil.
2. **Una idea por frase.** Las frases de interfaz son cortas: caben en una línea a 100 % de ancho.
3. **Concreto y sin jerga.** «No tienes permisos para gestionar departamentos», no «Acceso denegado (403)».
4. **Sin culpas.** Se describe lo que pasó, no quién falló. Nunca «has introducido mal la contraseña», sino «Credenciales inválidas. Verifica tu correo y tu contraseña».
5. **Invita a la siguiente acción.** Un mensaje de error dice qué hacer a continuación, o deja claro que no hay nada que hacer.

---

## 3. Tono por contexto

| Contexto | Tono | Ejemplo real |
| --- | --- | --- |
| Bienvenida | Cercano, con nombre propio | «Entrar a Coherev» |
| Navegación | Funcional, sin adjetivos | «Publicaciones de tu equipo» |
|Ayuda y tours |-guide, en segunda persona | «Aquí verás un saludo personalizado y los accesos rápidos a mensajes y publicaciones.» |
| Error de acción | Directo, sin disculpas | «No se pudo guardar el departamento.» |
| Permisos | Explicativo, sin reproche | «No tienes permisos para gestionar departamentos.» |
| Estado vacío | Propuesta, no ausencia | «No hay conversaciones para mostrar.» |
| Aviso de seguridad | Serio, sin alarmismo | «Credenciales inválidas. Verifica tu correo y tu contraseña.» |

---

## 4. Patrones de mensajes de error

Todos los mensajes de error del frontend siguen estas cuatro formas. Son el patrón de referencia para reescribir los que faltan (tarjeta BRAND-007).

| Patrón | Cuándo se usa | Forma | Ejemplo |
| --- | --- | --- | --- |
| **Acción fallida** | Una operación no se pudo completar | «No se pudo + verbo en infinitivo.» | «No se pudo eliminar la conversación.» |
| **Permiso insuficiente** | Falta autorización para la acción | «No tienes permisos para + sustantivo.» | «No tienes permisos para eliminar roles.» |
| **Regla de validación** | El dato introducido no cumple una regla | «El + campo + no puede + condición.» | «El nombre no puede estar vacío.» |
| **Credenciales** | El acceso falló | «Credenciales inválidas. Verifica tu correo y tu contraseña.» | — |
| **Límite de intentos** | Se superó el rate limit del login | «Demasiados intentos. Espera un minuto antes de volver a entrar.» | — |

### 4.1 Reglas de redacción

- **Punto final siempre.** Todos los mensajes terminados en punto.
- **Primera persona en plural solo para lo que sí depende de la persona**: «Tu resumen diario», «Tus documentos». Para lo demás, tercera persona o impersonal: «No se pudo enviar el mensaje».
- **Nada de signos de exclamación en errores.** La excitación se reserva para la navegación; un error no es una celebración.
- **Nada de jerga técnica** en la interfaz: no «token», no «endpoint», no «MIME». Cuando el término técnico es inevitable (MIME, archivo adjunto), se acompaña de una explicación en el mismo mensaje.
- **Sin emojis ni iconos dentro del texto del error.** Los iconos van en el componente, no en la frase.
- **Mayúscula inicial, minúsculas el resto.** Solo se capitalizan los nombres propios: *Coherev*, los nombres de rol (Administrador, Líder, Colaborador, Nuevo Ingreso) y los nombres de archivo en su forma literal.

---

## 5. Estados vacíos

Un estado vacío es una propuesta de uso, no un aviso de que falta algo.

| En vez de | Escribir |
| --- | --- |
| «No hay datos» | «No hay conversaciones para mostrar.» |
| «Sin resultados» | «No hay usuarios con esos filtros.» |
| «Vacío» | «Aún no hay departamentos» |

Cuando la acción siguiente es evidente, el estado vacío incluye el botón que la dispara.

---

## 6. Glosario

Los términos que la organización usa de una manera concreta. Deben aparecer siempre con este significado.

| Término | Significado |
| --- | --- |
| Administrador | Rol con acceso total: gestiona usuarios, roles, departamentos, documentos y contenido |
| Líder | Rol que gestiona su equipo: ve los departamentos sin eliminarlos, gestiona tareas y publica en su departamento |
| Colaborador | Rol de uso diario: chat, documentos de lectura y publicaciones |
| Nuevo Ingreso | Rol temporal: ve el Panel de Novedades destacado y el contenido público |
| Publicación general | Publicación visible para toda la organización (`department_id` nulo) |
| Visibilidad de un documento | Pública (todos), de departamento (los del área) o privada (solo el dueño y el Administrador) |
| Marcado para revisión | Borrado lógico: el elemento sale de su módulo y queda en la Papelera, desde donde se puede restaurar |
| Canal privado | Conexión de mensajería en tiempo real que solo pueden abrir los participantes de la conversación |
| Rol de un departamento | Permiso asociado a un área, con los flags `can_post_announcements` y `can_manage_department` |

---

## 7. Identidad visual

Los tokens viven en `frontend/app/globals.css` y son la única fuente de verdad del color. Un documento, una pantalla o una presentación que use Coherev toma los colores de aquí.

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--primary` | `#1c4fa3` | `#5b8def` | Acción principal, enlaces, foco |
| `--primary-hover` | `#173d7d` | `#7aa4f5` | Estado hover de la acción principal |
| `--accent` | `#2f8f6f` | `#4fd6a6` | Acento secundario, estados positivos |
| `--background` | `#e8edf8` | `#070b14` | Fondo de la aplicación |
| `--foreground` | `#16233c` | `#e6ecff` | Texto principal |
| `--muted` | `#5b6b80` | `#8aa0c2` | Texto secundario y metadatos |
| `--border` | `#d6dfef` | — | Bordes de tarjeta y separadores |

El logotipo es un **lockup oficial** (isotipo + wordmark) y se usa siempre como imagen (`components/coherev-logo.tsx`), nunca reconstruido con texto ni con otro dibujo. En modo oscuro se invierte el tono (`tone="light" | "dark"`).

---

## 8. Lo que no hacemos

- No usamos lenguaje promocional en la intranet: nada de «¡Increíble!», «¡Bienvenido a la mejor herramienta!».
- No usamos anglicismos innecesarios. El código usa inglés porque es la convención del framework; la interfaz, no.
- No exponemos identificadores técnicos en la interfaz: el código de error va al registro, no a la pantalla.
- No dejamos un error sin siguiente paso: si no hay acción posible, el mensaje lo dice («Por ahora no hay nada nuevo aquí»).

---

## 9. Referencias

- Implementación del copy: `frontend/app/page.tsx`, `frontend/app/dashboard/**`, `frontend/lib/help-tours.ts`
- Excepción de rate limit en el backend: `backend/bootstrap/app.php`
- Identidad visual: `frontend/app/globals.css`, `frontend/components/coherev-logo.tsx`
- Glosario y mensajes al usuario: `docs/Fase 2.2/4-Manual de usuario final.pdf`
- Requisito asociado: RNF-UXA-06 (mensajes de error claros con microcopy de marca), verificado en el caso CP-034
