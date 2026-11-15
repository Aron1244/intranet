# Evidencia de cierre — Coherev

| Campo | Detalle |
| --- | --- |
| Proyecto | Coherev — Sistema de Intranet Corporativa |
| Etapa | Fase 2.2 — Cierre de proyecto |
| Tarjetas | EVI-001 (evidencia del tablero) · EVI-002 (acta de usabilidad) |
| Responsable | Benjamín Herrera y Julián Tapia |

Esta carpeta reúne la evidencia que acompaña la entrega.

---

## 1. Decisión: la demo en vivo sustituye a las capturas

No se va a aportar un paquete de capturas de pantalla. **La evidencia principal del cierre será una demo en vivo del sistema**, delante de la docente guía. Es mejor evidencia que un álbum de capturas: se ve el sistema funcionando, con sus datos reales y sus tiempos reales, y permite responder preguntas en el momento.

Lo que esto cambia:

| Antes | Ahora |
| --- | --- |
| Capturas de cada vista del sistema | Demo en vivo recorre el sistema |
| Capturas del tablero de trabajo | El tablero se muestra en pantalla durante la demo, o se omite con justification |
| Acta de la sesión con usuarios reales | La sesión con usuarios reales **es** la demo, si se realiza con pilotos |

Lo que **no** cambia: la demo sustituye a las capturas, no al acta de usabilidad. Ver §4.

---

## 2. Qué contiene esta carpeta

| Archivo | Estado | Qué es |
| --- | --- | --- |
| `README.md` | [x] | Este índice: qué se entrega y por qué |
| `guion-demo.md` | [x] | Guion de la demo en vivo: recorrido, tiempos y qué se verifica en cada momento |
| `acta-demo.md` | [ ] | Acta de la sesión: se rellena el día de la demo |

---

## 3. Guion de la demo

`guion-demo.md` recorre los siete módulos operativos en 20 minutos, indica el dato de prueba con el que se entra y anota qué requisito se verifica en cada momento. Tres cosas que conviene tener presentes:

- **El chat en vivo no se puede demostrar tal como está.** La entrega de mensajes en tiempo real no funciona por DEF-032 y DEF-033 (§1.1 y §7.1 del checklist). Si la demo incluye el chat, hay que corregir esos dos defectos antes; si no, el guion lo cubre en modo degradado, que sigue siendo funcional.
- **La demo necesita los tres procesos arriba**: API Laravel en `:8000`, MariaDB sembrada y Reverb en `:8080`. El manual de implementación explica el arranque.
- **Los datos de prueba son los del seeder**: `postman.admin@test.local` / `Admin123!` para Administrador, `postman.user@test.local` / `User123!` para Colaborador.

---

## 4. Acta de usabilidad (EVI-002)

Sigue siendo obligatoria y es independiente de las capturas: es la evidencia del hito M4 y la base de las métricas de §7 del checklist (NSM, WAU, tiempo hasta el primer mensaje, tareas críticas sin asistencia).

**La forma más eficiente de conseguirla es que la propia demo se haga con 3 a 5 pilotos reales** en lugar de con la docente guía. La demo recorre los mismos flujos, de modo que el acta sale del mismo encuentro. Si la demo es solo de presentación, el acta necesita una sesión aparte.

El acta registra, como mínimo:

- Fecha, lugar y duración de la sesión.
- Perfil de cada piloto: rol, antigüedad y familiaridad con herramientas internas.
- Tareas asignadas y tiempo que tardó cada una sin asistencia.
- Incidencias detectadas y su severidad.
- Métricas del proyecto: NSM (mensajes / WAU / semana, objetivo 5), WAU y tiempo hasta el primer mensaje de un ingreso nuevo.
- Firma de cada piloto y del equipo.

**Formato**: PDF, con el mismo encabezado y pie de página que el resto de los documentos de la Fase 2.2.

---

## 5. Tablero de trabajo (EVI-001)

El tablero se demuestra en vivo o se documenta con una exportación del estado final de las 35 tarjetas del backlog. Se acepta cualquiera de las dos formas; lo que no se acepta es que falte.

---

## 6. Reglas

- **Ningún archivo se inventa.** Si una evidencia no existe porque la actividad no se ha realizado, queda en estado `[ ] Pendiente` y se explica el motivo. Una evidencia fabricada es un defecto, no una evidencia.
- **Los datos personales de los pilotos no se publican.** El acta identifica a los participantes por un código (P1, P2, P3) y no por nombre.
- **Cada evidencia se nombra con su origen**: `acta-demo-2026-12-11.pdf`.
- **Este índice se actualiza al incorporar cada evidencia**, con la fecha y el responsable.

---

## 7. Referencias

- Checklist de término, §3.1 y §8: `docs/Fase 2.2/6-Checklist de termino del proyecto.md`
- Plan de pruebas: `docs/Fase 2.2/1-Plan de pruebas.pdf`
- Casos de prueba: `docs/Fase 2.2/2-Casos de prueba.pdf`
- Manual de usuario final: `docs/Fase 2.2/4-Manual de usuario final.pdf`
- Manual de implementación (arranque del entorno): `docs/Fase 2.2/5-Manual de implementacion.pdf`
- Backlog con las 35 tarjetas: `docs/Fase 2.1/11-product backlog.xlsx`
