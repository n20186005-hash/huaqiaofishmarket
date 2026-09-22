"""依 public/logo.svg 的視覺設計產生 PWA 圖示（需要 Pillow）。

    python scripts/gen-pwa-icons.py

輸出：public/icons/icon-192.png、icon-512.png、icon-512-maskable.png
"""

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "icons")

CREAM = (255, 248, 223, 255)
DEEP = (7, 49, 58, 255)
TEAL = (11, 104, 113, 255)
GOLD = (226, 173, 50, 255)
RED = (187, 48, 38, 255)
WHITE = (255, 255, 255, 255)


def draw_logo(draw, k, ox=0.0, oy=0.0):
    """以 64x64 viewBox 為基準繪製標誌；k 為縮放比，(ox, oy) 為位移。"""
    p = lambda x, y: (ox + x * k, oy + y * k)

    # 底色圓盤
    r = 30 * k
    cx, cy = p(32, 32)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM, outline=DEEP, width=max(1, int(3 * k)))

    # 魚身與魚尾
    x0, y0 = p(12, 24)
    x1, y1 = p(43, 44)
    draw.ellipse([x0, y0, x1, y1], fill=TEAL)
    draw.polygon([p(41, 34), p(53, 23), p(51, 34), p(53, 45)], fill=TEAL)

    # 魚眼
    er = 1.8 * k
    ex, ey = p(37, 28)
    draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=WHITE)

    # 金色浪線
    draw.arc([p(14, 38)[0], p(14, 38)[1], p(50, 50)[0], p(50, 50)[1]], 180, 360, fill=GOLD, width=max(1, int(4 * k)))

    # 紅色印記
    rr = 7 * k
    rx, ry = p(48, 15)
    draw.ellipse([rx - rr, ry - rr, rx + rr, ry + rr], fill=RED)


def build(size, maskable=False):
    scale = 2
    canvas = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    if maskable:
        draw.rectangle([0, 0, size * scale, size * scale], fill=CREAM)
        # 安全區：內容收斂到約 72%
        k = (size * scale / 64) * 0.72
        ox = (size * scale - 64 * k) / 2
        oy = (size * scale - 64 * k) / 2
    else:
        k = size * scale / 64
        ox = oy = 0.0
    draw_logo(draw, k, ox, oy)
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-512-maskable.png", 512, True),
    ]
    for name, size, maskable in targets:
        img = build(size, maskable)
        img.save(os.path.join(OUT_DIR, name), "PNG", optimize=True)
        print("wrote", name)


if __name__ == "__main__":
    main()
