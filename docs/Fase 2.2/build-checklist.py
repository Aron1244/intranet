#!/usr/bin/env python3
"""
build-checklist.py — regenera el PDF del "Checklist de término del proyecto".

El documento vive en dos formas: esta fuente Markdown (editable) y el PDF que
se entrega. Para volver a producir el PDF hay que ejecutar:

    python docs/Fase 2.2/build-checklist.py

El pipeline usa la skill minimax-pdf (palette → cover → render_body → merge).
Si está instalada en otra ruta, se indica con la variable de entorno
MINIMAX_PDF_SKILL:

    set MINIMAX_PDF_SKILL=C:\\ruta\\a\\minimax-minimax-pdf
    python docs/Fase 2.2/build-checklist.py

Requisitos: Python 3.9+ con reportlab, pypdf y matplotlib; Node.js 18+ con
playwright (Chromium) para la portada.

El script hace dos pasadas: la primera mide en qué página cae cada encabezado
para paginar el índice de contenido; la segunda escribe esos números y vuelve
a renderizar.
"""

import argparse
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL_DIR = Path(os.environ.get(
    "MINIMAX_PDF_SKILL",
    r"C:\Users\Aron\.config\opencode\skills\minimax-minimax-pdf",
))
SCRIPTS = SKILL_DIR / "scripts"

PAGEBREAK_MARK = "@@PAGEBREAK@@"
INDEX_TITLE = "índice de contenido"
PIPE_MASK = "\ue000"

DOC_DIR = Path(__file__).resolve().parent
SOURCE = DOC_DIR / "6-Checklist de termino del proyecto.md"
OUTPUT = DOC_DIR / "6-Checklist de termino del proyecto.pdf"

TITLE = "Checklist de Término del Proyecto"
SUBTITLE = ("Cierre administrativo y validación de la entrega - Coherev, "
            "Sistema de Intranet Corporativa - Docente guía: "
            "Cindy Betzabé Contador Cisterna")
AUTHOR = "Benjamín Herrera · Julián Tapia"
DATE = "15 de noviembre de 2026"
DOC_TYPE = "academic"
ACCENT = "#1C4FA3"

# ── Tipografía ───────────────────────────────────────────────────────────────
# Una sola variable cambia la familia tipográfica de todo el documento (la
# portada HTML y el cuerpo ReportLab). El PDF original de la Fase 2.2 usaba
# Arial 11 pt con Consolas para el código; aquí se usa Calibri, que es lo
# pedido, y se deja el cambio a una línea si se prefiere otra familia.
FONT_FAMILY = "Calibri"
CODE_FAMILY = "Consolas"

_FONTS = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"

FONT_PATHS = {
    "Calibri":            _FONTS / "calibri.ttf",
    "Calibri-Bold":       _FONTS / "calibrib.ttf",
    "Calibri-Italic":     _FONTS / "calibrii.ttf",
    "Calibri-BoldItalic": _FONTS / "calibriz.ttf",
    "Calibri-Light":      _FONTS / "calibril.ttf",
    "Consolas":           _FONTS / "consola.ttf",
    "Consolas-Bold":      _FONTS / "consolab.ttf",
}

# Anchos de columna por firma de encabezados (fracciones que suman 1.0).
# La primera columna, cuando existe, es la marca de estado sin encabezado.
COL_WIDTHS = {
    ("Campo", "Detalle"): [0.26, 0.74],
    ("Versión", "Fecha", "Cambios"): [0.12, 0.18, 0.70],
    ("Bloque", "Completado", "Parcial", "Pendiente", "No aplica"): [0.40, 0.15, 0.15, 0.15, 0.15],
    ("Marca", "Significado"): [0.16, 0.84],
    ("Cambio", "Detalle"): [0.28, 0.72],
    ("Contenido", "Página"): [0.88, 0.12],
    ("", "ID", "Requerimiento", "Módulo o archivo", "Evidencia"): [0.06, 0.15, 0.22, 0.26, 0.31],
    ("", "ID", "Requerimiento", "Evidencia / observación"): [0.07, 0.18, 0.37, 0.38],
    ("", "Ítem", "Estado", "Evidencia"): [0.06, 0.36, 0.14, 0.44],
    ("", "Ítem", "Estado", "Fecha objetivo"): [0.06, 0.56, 0.14, 0.24],
    ("", "Documento", "Ubicación", "Observación"): [0.06, 0.24, 0.30, 0.40],
    ("", "Documento", "Prometido en", "Observación"): [0.06, 0.24, 0.30, 0.40],
    ("", "Ítem", "Motivo"): [0.07, 0.43, 0.50],
    ("", "Ítem", "Estado", "Observación"): [0.06, 0.26, 0.14, 0.54],
    ("", "Ítem", "Estado", "Evidencia", "Responsable"): [0.05, 0.23, 0.13, 0.38, 0.21],
    ("Dimensión", "Total", "Implementado", "Parcial", "Pendiente", "% de cumplimiento"):
        [0.38, 0.12, 0.15, 0.12, 0.13, 0.10],
    ("ID", "Riesgo", "Impacto", "Mitigación vigente"): [0.07, 0.26, 0.11, 0.56],
    ("#", "Bloqueo", "Tipo", "Acción requerida", "Responsable"): [0.05, 0.23, 0.16, 0.35, 0.21],
    ("ID del caso", "Resultado obtenido", "Estado", "Defecto asociado"): [0.20, 0.34, 0.22, 0.24],
    ("Actividad", "Formato", "Duración estimada", "Fecha"): [0.30, 0.38, 0.16, 0.16],
    ("Rol", "Nombre", "Fecha", "Firma"): [0.26, 0.30, 0.22, 0.22],
    ("#", "Incidencia", "Impacto", "Tratamiento"): [0.05, 0.35, 0.24, 0.36],
    ("Dato", "Valor"): [0.32, 0.68],
}

# Tablas anchas: se reducen a 8,5 pt para que los identificadores largos
# (RF-AUT-01, AuthController::login) no se partan a mitad de palabra.
SMALL_FONT_TABLES = {
    ("", "ID", "Requerimiento", "Módulo o archivo", "Evidencia"),
    ("", "ID", "Requerimiento", "Evidencia / observación"),
    ("", "Ítem", "Estado", "Evidencia", "Responsable"),
    ("ID", "Riesgo", "Impacto", "Mitigación vigente"),
    ("#", "Bloqueo", "Tipo", "Acción requerida", "Responsable"),
    ("ID del caso", "Resultado obtenido", "Estado", "Defecto asociado"),
    ("Dimensión", "Total", "Implementado", "Parcial", "Pendiente", "% de cumplimiento"),
}


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


if not SCRIPTS.is_dir():
    sys.exit(
        f"No se encuentra la skill minimax-pdf en {SKILL_DIR}.\n"
        "Indica su ruta con la variable de entorno MINIMAX_PDF_SKILL."
    )

palette = load("palette")
cover = load("cover")
render_body = load("render_body")
merge = load("merge")
reformat_parse = load("reformat_parse")


# ── Ajustes de render_body ───────────────────────────────────────────────────
# 1) repeatRows=1: sin esto, una tabla que se parte entre páginas pierde su
#    encabezado. Es imprescindible en un documento mayoritariamente tabular.
# 2) Numeración de página con desplazamiento +1: la portada fusionada es la
#    página 1, de modo que el cuerpo arranca en la 2 (igual que el original).
# 3) Tamaño de fuente por tabla, para las tablas de cuatro columnas densas.
# 4) Relleno interno más compacto: 10 pt a cada lado dejan sin sitio a los
#    identificadores largos y duplican el número de páginas.
_orig_table = render_body.Table


def _table_repeat_rows(*args, **kwargs):
    kwargs.setdefault("repeatRows", 1)
    return _orig_table(*args, **kwargs)


render_body.Table = _table_repeat_rows

_orig_add_table = render_body._add_table


def _add_table_sized(story, item, ctx):
    size = item.get("font_size")
    if size:
        from reportlab.lib.styles import ParagraphStyle

        styles = dict(ctx["styles"])
        styles["table_cell"] = ParagraphStyle(
            "TblCsmall", parent=styles["table_cell"],
            fontSize=size, leading=size * 1.38)
        styles["table_header"] = ParagraphStyle(
            "TblHsmall", parent=styles["table_header"],
            fontSize=size, leading=size * 1.38)
        ctx = dict(ctx, styles=styles)
    _orig_add_table(story, item, ctx)


render_body._add_table = _add_table_sized

_orig_style = render_body.TableStyle


def _style_compact(commands):
    commands = list(commands)
    commands.append(("TOPPADDING", (0, 0), (-1, -1), 4))
    commands.append(("BOTTOMPADDING", (0, 0), (-1, -1), 4))
    commands.append(("LEFTPADDING", (0, 0), (-1, -1), 6))
    commands.append(("RIGHTPADDING", (0, 0), (-1, -1), 6))
    return _orig_style(commands)


render_body.TableStyle = _style_compact


def _decorate(self, canv, doc):
    """Encabezado y pie de página, con la numeración alineada al PDF final."""
    t = self._t
    lm = doc.leftMargin
    rm = doc.rightMargin
    pw = doc.pagesize[0]
    ph = doc.pagesize[1]
    top = ph - doc.topMargin

    canv.saveState()

    canv.setStrokeColor(render_body.HexColor(t["accent"]))
    canv.setLineWidth(1.5)
    canv.line(lm, top + 12, pw - rm, top + 12)

    canv.setFillColor(render_body.HexColor(t["muted"]))
    canv.setFont(t["font_body_rl"], t["size_meta"])
    canv.drawString(lm, top + 16, t["title"].upper())
    canv.drawRightString(pw - rm, top + 16, t.get("date", ""))

    canv.setStrokeColor(render_body.HexColor("#DDDDDD"))
    canv.setLineWidth(0.5)
    canv.line(lm, doc.bottomMargin - 12, pw - rm, doc.bottomMargin - 12)

    canv.setFillColor(render_body.HexColor(t["muted"]))
    canv.setFont(t["font_body_rl"], t["size_meta"])
    canv.drawString(lm, doc.bottomMargin - 22, t.get("author", ""))
    canv.drawRightString(pw - rm, doc.bottomMargin - 22, str(doc.page + 1))

    canv.restoreState()


render_body.BeautifulDoc._decorate = _decorate

# La skill re-registra los nombres estándar (Helvetica, Times, Courier…) como
# alias de la fuente elegida, pero no declara la familia de la fuente propia.
# Sin esto, el énfasis <b> dentro de un párrafo en Calibri caería a Helvetica.
_orig_register_fonts = render_body.register_fonts


def _register_fonts(tokens):
    from reportlab.pdfbase import pdfmetrics

    _orig_register_fonts(tokens)
    body = tokens.get("font_body_rl", FONT_FAMILY)
    pdfmetrics.registerFontFamily(
        body,
        normal=body,
        bold=tokens.get("font_body_b_rl", body),
        italic=tokens.get("font_code_rl", body),
        boldItalic=tokens.get("font_body_b_rl", body),
    )


render_body.register_fonts = _register_fonts


# ── Construcción de bloques ───────────────────────────────────────────────────
def _rl_markup(text: str) -> str:
    """Markdown en línea → marcado de ReportLab.

    El parser de la skill no aplica _md_inline a las celdas de tabla: se
    renderizan como Paragraph directo. Por eso aquí hay que traducir el
    énfasis y el código a marcado de ReportLab. Los fragmentos de código se
    apartan antes de buscar énfasis: su contenido puede traer asteriscos
    (por ejemplo `Access-Control-Allow-Origin: *`) que no son énfasis.

    El fragmento de código se emite con el nombre real de la fuente —no con
    el alias "Courier" de ReportLab: ese alias resuelve por familia y acaba
    cayendo en la negrita de Calibri.
    """
    codes: list[str] = []

    def stash(m):
        codes.append(m.group(1))
        return f"\ue001{len(codes) - 1}\ue001"

    text = re.sub(r"`(.+?)`", stash, text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", text)
    text = re.sub(
        "\ue001(\\d+)\ue001",
        lambda m: f'<font name="{CODE_FAMILY}">{codes[int(m.group(1))]}</font>',
        text,
    )
    return text


def markdown_to_blocks(md_path: Path) -> list:
    # utf-8-sig descarta un eventual BOM inicial: rompería el primer encabezado.
    text = md_path.read_text(encoding="utf-8-sig")
    text = text.replace("<!-- pagebreak -->", PAGEBREAK_MARK)
    # El pipe escapado (\|) se enmascara antes de parsear: el parser de la
    # skill parte las filas por "|", y un pipe suelto rompería la tabla.
    text = text.replace("\\|", PIPE_MASK)
    blocks = reformat_parse.parse_markdown(text)

    out = []
    for b in blocks:
        if b.get("type") == "body" and b.get("text", "").strip() == PAGEBREAK_MARK:
            out.append({"type": "pagebreak"})
            continue
        if b.get("type") == "table":
            key = tuple(b.get("headers", []))
            if key in COL_WIDTHS:
                b["col_widths"] = COL_WIDTHS[key]
            if key in SMALL_FONT_TABLES:
                b["font_size"] = 8.5
            b["headers"] = [_rl_markup(h) for h in b.get("headers", [])]
            b["rows"] = [[_rl_markup(c) for c in row] for row in b.get("rows", [])]
        out.append(b)

    # Se restauran los pipes enmascarados.
    for b in out:
        if b.get("text"):
            b["text"] = b["text"].replace(PIPE_MASK, "|")
        if b.get("headers"):
            b["headers"] = [h.replace(PIPE_MASK, "|") for h in b["headers"]]
        if b.get("rows"):
            b["rows"] = [[c.replace(PIPE_MASK, "|") for c in row]
                         for row in b["rows"]]
    return out


def split_toc(blocks: list):
    """Separa el índice de contenido del resto del cuerpo.

    El índice termina en el primer salto de página posterior a su título:
    así el cuerpo arranca en una página propia y los encabezados que le
    siguen no se confunden con las filas de la tabla de contenido.
    """
    for i, b in enumerate(blocks):
        if b.get("type") == "h2" and INDEX_TITLE in b.get("text", "").lower():
            for j in range(i + 1, len(blocks)):
                if blocks[j].get("type") == "pagebreak":
                    return blocks[: i + 1], blocks[j], blocks[j + 1 :]
            return blocks[: i + 1], None, blocks[i + 1 :]
    return None, None, blocks


def _strip_markup(text: str) -> str:
    """Texto legible de un título que puede traer marcado de ReportLab.

    Los títulos se indexan y se buscan en el PDF por su texto plano: si
    llevan un fragmento de código, el marcado hay que retirarlo antes de
    comparar.
    """
    t = re.sub(r"<font[^>]*>", "", text)
    for tag in ("</font>", "<b>", "</b>", "<i>", "</i>"):
        t = t.replace(tag, "")
    return t.replace("`", "").strip()


def collect_headings(blocks: list) -> list:
    """Títulos de nivel 1 y 2 que figuran en el índice."""
    return [(b["type"], _strip_markup(b["text"]))
            for b in blocks if b.get("type") in ("h1", "h2")]


def build_toc_table(headings: list, page_map: dict) -> dict:
    rows = []
    for level, text in headings:
        # Las celdas de tabla se renderizan como Paragraph directo: el
        # énfasis va en marcado ReportLab, no en Markdown.
        label = f"<b>{text}</b>" if level == "h1" else text
        rows.append([label, str(page_map.get(text, ""))])
    return {"type": "table", "headers": ["Contenido", "Página"], "rows": rows,
            "col_widths": [0.88, 0.12]}


def locate_pages(body_pdf: Path, headings: list) -> dict:
    """Página (1-based en el PDF fusionado) donde empieza cada título.

    Solo se consideran las líneas compuestas por los títulos tipográficos
    (22 pt para h1, 15 pt para h2). Así una celda de tabla que repita el
    texto de una sección —el resumen por bloque, por ejemplo— no se confunde
    con el encabezado real.
    """
    import pymupdf

    doc = pymupdf.open(body_pdf)
    heading_lines = []
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                if not spans:
                    continue
                size = max(s.get("size", 0) for s in spans)
                if size >= 14:
                    heading_lines.append(
                        (page.number, " ".join(s["text"] for s in spans).strip()))
    doc.close()

    page_map = {}
    for _, text in headings:
        needle = text.strip()
        for page_no, line in heading_lines:
            if line == needle:
                page_map[text] = page_no + 2  # +1 portada fusionada, +1 base 1
                break
    return page_map


# ── Pipeline ──────────────────────────────────────────────────────────────────
def render_cover(tokens: dict, out_pdf: Path, workdir: Path) -> None:
    html = cover.render(tokens)
    html_path = workdir / "cover.html"
    html_path.write_text(html, encoding="utf-8")
    subprocess.run(
        ["node", str(SCRIPTS / "render_cover.js"),
         "--input", str(html_path), "--out", str(out_pdf)],
        check=True, cwd=str(SCRIPTS),
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(SOURCE))
    ap.add_argument("--out", default=str(OUTPUT))
    ap.add_argument("--workdir",
                    default=str(Path(tempfile.gettempdir()) / "checklist-build"))
    args = ap.parse_args()

    workdir = Path(args.workdir).resolve()
    workdir.mkdir(parents=True, exist_ok=True)
    source = Path(args.source).resolve()

    tokens = palette.build_tokens(
        title=TITLE,
        doc_type=DOC_TYPE,
        author=AUTHOR,
        date=DATE,
        accent_override=ACCENT,
    )
    tokens["subtitle"] = SUBTITLE

    # Tipografía: Calibri en todo el documento (portada y cuerpo) y Consolas
    # para el código, igual que en el resto de la documentación del proyecto.
    missing = [n for n, p in FONT_PATHS.items() if not p.exists()]
    if missing:
        sys.exit(f"Faltan archivos de fuente en {_FONTS}: {', '.join(missing)}")
    tokens["font_paths"] = {n: str(p) for n, p in FONT_PATHS.items()}
    tokens["font_body_rl"] = FONT_FAMILY
    tokens["font_body_b_rl"] = f"{FONT_FAMILY}-Bold"
    tokens["font_display_rl"] = f"{FONT_FAMILY}-Bold"
    tokens["font_code_rl"] = CODE_FAMILY
    tokens["font_display"] = FONT_FAMILY
    tokens["font_body"] = FONT_FAMILY
    tokens["gfonts_import"] = ""  # sin Google Fonts: todo es local

    (workdir / "tokens.json").write_text(
        json.dumps(tokens, indent=2, ensure_ascii=False), encoding="utf-8")

    cover_pdf = workdir / "cover.pdf"
    body_pdf = workdir / "body.pdf"
    render_cover(tokens, cover_pdf, workdir)

    blocks = markdown_to_blocks(source)
    toc_head, toc_break, body_blocks = split_toc(blocks)
    headings = collect_headings(body_blocks)

    def compose(page_map: dict) -> list:
        if toc_head is None:
            return body_blocks
        out = toc_head + [build_toc_table(headings, page_map)]
        if toc_break is not None:
            out.append(toc_break)
        return out + body_blocks

    # Pasada 1: índice con números provisionales (altura idéntica a la final).
    (workdir / "content.json").write_text(
        json.dumps(compose({}), indent=2, ensure_ascii=False), encoding="utf-8")
    render_body.build(tokens, compose({}), str(body_pdf))

    # Pasada 2: índice con los números reales.
    page_map = locate_pages(body_pdf, headings)
    (workdir / "content.json").write_text(
        json.dumps(compose(page_map), indent=2, ensure_ascii=False), encoding="utf-8")
    render_body.build(tokens, compose(page_map), str(body_pdf))

    merge.merge(str(cover_pdf), str(body_pdf), str(Path(args.out).resolve()),
                title=TITLE)

    print(json.dumps({
        "status": "ok",
        "out": str(Path(args.out).resolve()),
        "headings": len(headings),
        "sin_paginar": [t for _, t in headings if t not in page_map],
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
