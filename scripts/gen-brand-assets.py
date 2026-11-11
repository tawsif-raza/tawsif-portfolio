"""
Generates the social share image (public/og-image.png, 1200x630): the name,
role and tagline in the site's colours, with the TR mark on the right.

    python scripts/gen-brand-assets.py

The mark is drawn by scripts/gen-logo-assets.py, so the share image always
matches the logo. Not part of the build pipeline: run it, commit the output.
"""
import importlib.util
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og-image.png"

BG = "#08090b"  # --color-bg
ACCENT = "#c6f432"  # --color-accent
PAPER = "#f2f3ef"  # --color-paper
DIM = "#a0a6af"  # --color-dim
LINE = "#22262d"  # --color-line

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"

W, H = 1200, 630


def load_logo_module():
    spec = importlib.util.spec_from_file_location("gen_logo_assets", Path(__file__).with_name("gen-logo-assets.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    img = Image.new("RGB", (W, H), BG)

    # Soft lime glow behind the mark, like the site's accent lighting.
    glow = Image.new("RGB", (W, H), BG)
    ImageDraw.Draw(glow).ellipse((760, 120, 1180, 510), fill="#1b2410")  # --color-accent-soft
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(90)), 0.9)

    mark = load_logo_module().render_mark(210)
    img.paste(mark, (970 - mark.width // 2, H // 2 - mark.height // 2), mark)

    draw = ImageDraw.Draw(img)
    x = 80
    draw.text((x, 196), "Tawsif Raza Khan", font=ImageFont.truetype(FONT_BOLD, 68), fill=PAPER)
    draw.text((x, 296), "AI/ML ENGINEER  ·  AUTOMATION ARCHITECT", font=ImageFont.truetype(FONT_BOLD, 24), fill=ACCENT)
    draw.text((x, 350), "Agentic systems that run on their own.", font=ImageFont.truetype(FONT_REG, 30), fill=DIM)
    draw.line((x, 428, x + 96, 428), fill=LINE, width=2)

    img.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} {img.size}")


if __name__ == "__main__":
    main()
