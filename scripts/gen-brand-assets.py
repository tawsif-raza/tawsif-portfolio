"""
One-off generator for brand image assets referenced in the professionalism
plan: apple-touch-icon.png, manifest icons, and the OG/social preview image.
Not part of the build pipeline — run once, commit the output, done.
Recreates the node-graph motif already used in public/favicon.svg so
every icon/share-card stays visually consistent with the rest of the site.
"""
from PIL import Image, ImageDraw, ImageFont

BG = "#050504"
AMBER = "#c98a3b"
AMBER_DIM = "#6b4e22"
PAPER = "#ede6d6"
DIM = "#9a8f78"

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"

# Node/edge layout in a 0-40 viewbox, matching favicon.svg exactly.
NODES = [
    (8, 20, 3, 1.0),
    (20, 12, 2.4, 0.85),
    (20, 28, 2.4, 0.85),
    (32, 20, 3.2, 1.0),
]
EDGES = [
    ((11, 20), (17, 14)),
    ((11, 20), (17, 26)),
    ((22, 13), (30, 19)),
    ((22, 27), (30, 21)),
]


def draw_node_glyph(draw, ox, oy, scale):
    for (x1, y1), (x2, y2) in EDGES:
        draw.line(
            [(ox + x1 * scale, oy + y1 * scale), (ox + x2 * scale, oy + y2 * scale)],
            fill=AMBER_DIM,
            width=max(1, round(1.4 * scale)),
        )
    for x, y, r, op in NODES:
        cx, cy, rr = ox + x * scale, oy + y * scale, r * scale
        color = AMBER if op >= 1.0 else _blend(AMBER, BG, op)
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=color)


def _blend(hex_fg, hex_bg, alpha):
    fg = tuple(int(hex_fg[i : i + 2], 16) for i in (1, 3, 5))
    bg = tuple(int(hex_bg[i : i + 2], 16) for i in (1, 3, 5))
    return tuple(round(f * alpha + b * (1 - alpha)) for f, b in zip(fg, bg))


def make_icon(size, path):
    ss = 4  # supersample for clean anti-aliasing at small sizes
    big = Image.new("RGB", (size * ss, size * ss), BG)
    d = ImageDraw.Draw(big)
    draw_node_glyph(d, 0, 0, (size * ss) / 40)
    img = big.resize((size, size), Image.LANCZOS)
    img.save(path)
    print(f"wrote {path} ({size}x{size})")


def make_og_image(path):
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)

    # Larger node-graph motif, right-aligned, drawn at high res then composited.
    ss = 4
    glyph_size = 420
    big = Image.new("RGBA", (glyph_size * ss, glyph_size * ss), (0, 0, 0, 0))
    bd = ImageDraw.Draw(big)
    draw_node_glyph(bd, 0, 0, (glyph_size * ss) / 40)
    glyph = big.resize((glyph_size, glyph_size), Image.LANCZOS)
    img.paste(glyph, (w - glyph_size - 60, (h - glyph_size) // 2), glyph)

    title_font = ImageFont.truetype(FONT_BOLD, 64)
    subtitle_font = ImageFont.truetype(FONT_BOLD, 30)
    tagline_font = ImageFont.truetype(FONT_REG, 26)

    x = 80
    d.text((x, 220), "Tawsif Raza Khan", font=title_font, fill=PAPER)
    d.text((x, 300), "AI/ML ENGINEER & AUTOMATION ARCHITECT", font=subtitle_font, fill=AMBER)
    d.text((x, 350), "Agentic systems that run on their own.", font=tagline_font, fill=DIM)

    img.save(path)
    print(f"wrote {path} ({w}x{h})")


if __name__ == "__main__":
    make_icon(180, "public/apple-touch-icon.png")
    make_icon(192, "public/icon-192.png")
    make_icon(512, "public/icon-512.png")
    make_og_image("public/og-image.png")
