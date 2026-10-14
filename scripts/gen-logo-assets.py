"""
Generates every logo/favicon asset from the flat "TR" circuit monogram.

    python scripts/gen-logo-assets.py [source.png]

`source.png` is the monogram on a plain black background. Default:
brand/tr-monogram-source.png (the logo cropped out of the original
1024x572 render, kept in the repo so this script is reproducible).

Outputs (all committed; not part of the build pipeline):
  public/logo.png             transparent nav logo, trimmed, 128px tall
                              (4x the 32px it renders at in the nav)
  public/favicon.ico          16/32/48, transparent (browser tab)
  public/icon-192.png         manifest icon, on the site background
  public/icon-512.png         manifest icon, on the site background
  public/apple-touch-icon.png 180x180, on the site background (iOS
                              ignores transparency and would fill black)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = ROOT / "brand" / "tr-monogram-source.png"
PUBLIC = ROOT / "public"
SITE_BG = (8, 9, 11)  # --color-bg / #08090b
BLACK_POINT = 3  # the render's background sits at 0-2


def cut_out(src: Image.Image) -> Image.Image:
    """Black background -> transparency, keeping anti-aliased edges.

    Each pixel is treated as (logo colour x alpha) composited over black:
    alpha comes from the brightest channel, and the colour is
    un-premultiplied so edges keep their true green/blue instead of
    going muddy when placed on a non-black background.
    """
    rgb = np.asarray(src.convert("RGB")).astype(np.float64)
    mx = rgb.max(axis=-1)
    alpha = np.clip((mx - BLACK_POINT) / (255 - BLACK_POINT), 0, 1)
    with np.errstate(divide="ignore", invalid="ignore"):
        colour = np.where(alpha[..., None] > 0, rgb / np.maximum(alpha[..., None], 1e-6), 0)
    colour = np.clip(colour, 0, 255)
    out = np.dstack([colour, alpha * 255]).round().astype(np.uint8)
    return Image.fromarray(out)  # (h, w, 4) uint8 -> RGBA


def logo_bbox(src: Image.Image, pad: int = 6):
    """Bounds of the coloured monogram only. Saturation-based, so neutral
    grey marks elsewhere in a render (e.g. a corner sparkle) are ignored."""
    rgb = np.asarray(src.convert("RGB")).astype(int)
    sat = (rgb.max(-1) - rgb.min(-1)) > 50
    ys, xs = np.where(sat)
    x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
    return max(0, x0), max(0, y0), min(src.width, x1 + 1), min(src.height, y1 + 1)


def fit_square(logo: Image.Image, size: int, fill: float, bg=None) -> Image.Image:
    """Centre `logo` in a size x size square, its longer side at `fill`."""
    scale = (size * fill) / max(logo.size)
    w, h = max(1, round(logo.width * scale)), max(1, round(logo.height * scale))
    resized = logo.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (*bg, 255) if bg else (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - w) // 2, (size - h) // 2))
    return canvas if bg is None else canvas.convert("RGB")


def main():
    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    src = Image.open(src_path).convert("RGB")
    cropped = src.crop(logo_bbox(src))

    # Keep a clean, cropped source in the repo (only when reading a raw render).
    if src_path.resolve() != DEFAULT_SRC.resolve():
        DEFAULT_SRC.parent.mkdir(exist_ok=True)
        cropped.save(DEFAULT_SRC, optimize=True)
        print(f"wrote {DEFAULT_SRC.relative_to(ROOT)} {cropped.size}")

    logo = cut_out(cropped)
    # trim to the visible pixels so the nav image has no dead space
    logo = logo.crop(logo.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())

    nav_h = 128
    nav = logo.resize((round(logo.width * nav_h / logo.height), nav_h), Image.LANCZOS)
    # 128-colour palette PNG: a two-colour logo loses nothing visible and
    # drops from ~22 KB to ~5 KB (alpha edges are kept by FASTOCTREE).
    nav.quantize(colors=128, method=Image.Quantize.FASTOCTREE).save(PUBLIC / "logo.png", optimize=True)
    print(f"wrote public/logo.png {nav.size}")

    # Tab icons: transparent, near edge-to-edge so the strokes survive 16px.
    ico_frames = [fit_square(logo, s, 0.96) for s in (16, 32, 48)]
    ico_frames[-1].save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico_frames[:-1])
    print("wrote public/favicon.ico (16, 32, 48)")

    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")):
        fit_square(logo, size, 0.74, bg=SITE_BG).save(PUBLIC / name, optimize=True)
        print(f"wrote public/{name} ({size}x{size})")


if __name__ == "__main__":
    main()
