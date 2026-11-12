"""
Generates every logo/favicon asset for the "TR" monogram.

    uv run scripts/gen-logo-assets.py

The mark is defined below as a handful of strokes on a 64-unit grid, in the
site's own colours (lime T, paper-white R), so it needs no source image: the
SVGs and the PNG/ICO files are all drawn from the same geometry.

It is drawn as a 3D block: each letter is extruded down and to the right in
a darker shade of its own colour, and the front face carries a soft
top-to-bottom gradient, as if lit from above.

Outputs (all committed; not part of the build pipeline):
  public/logo.svg             the bare mark, transparent (nav)
  public/logo.png             the same, 128px tall (fallback / sharing)
  public/favicon.svg          the mark on a dark rounded tile (browser tab)
  public/favicon.ico          16/32/48 of that tile (older browsers)
  public/icon-192.png         manifest icon, full-bleed site background
  public/icon-512.png         manifest icon, full-bleed site background
  public/apple-touch-icon.png 180x180, full-bleed (iOS rounds it itself)
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

SITE_BG = "#08090b"  # --color-bg

# Per letter: face gradient (top, bottom) and the colour of the extruded side.
LIME = {"id": "t", "top": "#dcff5e", "bottom": "#b5e124", "side": "#5f7812"}  # around --color-accent
PAPER = {"id": "r", "top": "#ffffff", "bottom": "#d9dcd6", "side": "#73787f"}  # around --color-paper

STROKE = 6.0  # stroke width on the 64-unit grid; round caps and joins
DEPTH = (2.6, 3.6)  # extrusion offset (right, down) on the same grid
DEPTH_STEPS = 9  # copies of the shape that make up the extruded side
TILE = 64.0  # favicon tile size
TILE_RADIUS = 14.0
SS = 8  # supersampling factor for the PNG renders


def arc(cx, cy, r, a0, a1, steps=24):
    return [
        (
            cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / steps)),
            cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / steps)),
        )
        for i in range(steps + 1)
    ]


# (letter, polyline). The T is lime, the R is paper white.
STROKES = [
    (LIME, [(10, 18), (29, 18)]),  # T bar
    (LIME, [(19.5, 18), (19.5, 46)]),  # T stem
    (PAPER, [(38, 46), (38, 18), (46, 18), *arc(46, 25, 7, -90, 90), (38, 32)]),  # R stem + bowl
    (PAPER, [(45, 32), (53, 46)]),  # R leg
]
LETTERS = (LIME, PAPER)

_xs = [x for _, pts in STROKES for x, _ in pts]
_ys = [y for _, pts in STROKES for _, y in pts]
# Bounds of the front face, then of the whole block including the extrusion.
FACE_Y0, FACE_Y1 = min(_ys) - STROKE / 2, max(_ys) + STROKE / 2
X0, Y0 = min(_xs) - STROKE / 2, FACE_Y0
X1, Y1 = max(_xs) + STROKE / 2 + DEPTH[0], FACE_Y1 + DEPTH[1]
MARK_W, MARK_H = X1 - X0, Y1 - Y0


def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def svg_mark(dx, dy):
    """The mark's SVG, shifted by (dx, dy). Each letter's strokes are defined
    once and reused for every slice of the extrusion and for the face."""
    defs, sides, faces = [], [], []
    for letter in LETTERS:
        paths = "".join(
            '<path d="M' + " L".join(f"{fmt(x + dx)} {fmt(y + dy)}" for x, y in pts) + '"/>'
            for owner, pts in STROKES
            if owner is letter
        )
        lid = letter["id"]
        defs.append(f'<g id="{lid}">{paths}</g>')
        defs.append(
            f'<linearGradient id="{lid}f" gradientUnits="userSpaceOnUse" x1="0" x2="0" '
            f'y1="{fmt(FACE_Y0 + dy)}" y2="{fmt(FACE_Y1 + dy)}">'
            f'<stop offset="0" stop-color="{letter["top"]}"/><stop offset="1" stop-color="{letter["bottom"]}"/>'
            f"</linearGradient>"
        )
        for i in range(DEPTH_STEPS, 0, -1):
            f = i / DEPTH_STEPS
            sides.append(
                f'<use href="#{lid}" stroke="{letter["side"]}" '
                f'transform="translate({fmt(DEPTH[0] * f)} {fmt(DEPTH[1] * f)})"/>'
            )
        faces.append(f'<use href="#{lid}" stroke="url(#{lid}f)"/>')
    nl = "\n    "
    return (
        f"<defs>{nl}{nl.join(defs)}\n  </defs>\n"
        f'  <g fill="none" stroke-width="{fmt(STROKE)}" stroke-linecap="round" stroke-linejoin="round">'
        f"{nl}{nl.join(sides)}{nl}{nl.join(faces)}\n  </g>"
    )


def write_svgs():
    logo = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(MARK_W)} {fmt(MARK_H)}" '
        f'width="{fmt(MARK_W)}" height="{fmt(MARK_H)}" role="img" aria-label="TR">\n'
        f"  {svg_mark(-X0, -Y0)}\n</svg>\n"
    )
    (PUBLIC / "logo.svg").write_text(logo, encoding="utf-8", newline="\n")

    dx, dy = (TILE - MARK_W) / 2 - X0, (TILE - MARK_H) / 2 - Y0
    favicon = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(TILE)} {fmt(TILE)}">\n'
        f'  <rect width="{fmt(TILE)}" height="{fmt(TILE)}" rx="{fmt(TILE_RADIUS)}" fill="{SITE_BG}"/>\n'
        f"  {svg_mark(dx, dy)}\n</svg>\n"
    )
    (PUBLIC / "favicon.svg").write_text(favicon, encoding="utf-8", newline="\n")
    print("wrote public/logo.svg, public/favicon.svg")


def draw_strokes(draw, letter, fill, scale, dx, dy):
    """One letter's strokes with round caps/joins: a thick line per segment
    plus a disc on every vertex."""
    w = STROKE * scale
    for owner, pts in STROKES:
        if owner is not letter:
            continue
        p = [((x + dx) * scale, (y + dy) * scale) for x, y in pts]
        draw.line(p, fill=fill, width=round(w))
        for x, y in p:
            draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=fill)


def hex_rgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def draw_mark(img, scale, dx, dy):
    """Paint the 3D mark onto `img` (RGBA): extruded sides, then the faces."""
    draw = ImageDraw.Draw(img)
    for letter in LETTERS:
        for i in range(DEPTH_STEPS * 3, 0, -1):  # finer than the SVG: free here
            f = i / (DEPTH_STEPS * 3)
            draw_strokes(draw, letter, letter["side"], scale, dx + DEPTH[0] * f, dy + DEPTH[1] * f)
    y0, y1 = (FACE_Y0 + dy) * scale, (FACE_Y1 + dy) * scale
    for letter in LETTERS:
        mask = Image.new("L", img.size, 0)
        draw_strokes(ImageDraw.Draw(mask), letter, 255, scale, dx, dy)
        top, bottom = hex_rgb(letter["top"]), hex_rgb(letter["bottom"])
        column = Image.new("RGB", (1, img.height))
        for y in range(img.height):
            t = min(1.0, max(0.0, (y - y0) / (y1 - y0)))
            column.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(top, bottom, strict=True)))
        img.paste(column.resize(img.size), (0, 0), mask)


def render_mark(height):
    """The bare mark on transparency, `height` px tall."""
    scale = height / MARK_H * SS
    size = (round(MARK_W * scale), round(MARK_H * scale))
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_mark(img, scale, -X0, -Y0)
    return img.resize((round(size[0] / SS), height), Image.Resampling.LANCZOS)


def render_tile(size, rounded, fill):
    """The mark centred on a dark square. `fill` is the mark's width as a
    fraction of the square; `rounded` clips the corners (tab icons)."""
    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=TILE_RADIUS / TILE * big, fill=SITE_BG)
    else:
        draw.rectangle((0, 0, big, big), fill=SITE_BG)
    scale = big * fill / MARK_W
    dx = (big / scale - MARK_W) / 2 - X0
    dy = (big / scale - MARK_H) / 2 - Y0
    draw_mark(img, scale, dx, dy)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def main():
    write_svgs()

    render_mark(128).save(PUBLIC / "logo.png", optimize=True)
    print("wrote public/logo.png")

    # Tab icons: same proportions as favicon.svg.
    frames = [render_tile(s, True, MARK_W / TILE) for s in (16, 32, 48)]
    frames[-1].save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:-1])
    print("wrote public/favicon.ico (16, 32, 48)")

    # Home-screen icons: full bleed, mark kept inside the maskable safe zone.
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")):
        render_tile(size, False, 0.6).convert("RGB").save(PUBLIC / name, optimize=True)
        print(f"wrote public/{name} ({size}x{size})")


if __name__ == "__main__":
    main()
