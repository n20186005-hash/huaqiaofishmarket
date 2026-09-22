"""產生 OG／社群分享封面圖（需要 Pillow）。

    python scripts/gen-og-cover.py

輸出：public/images/og-cover.jpg（1200x630）
"""

import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images", "og-cover.jpg")

W, H = 1200, 630
DEEP = (6, 46, 53)
SEA = (11, 104, 113)
CREAM = (255, 248, 223)
GOLD = (226, 173, 50)
RED = (187, 48, 38)
WHITE = (255, 255, 255)

FONT_BOLD = "C:/Windows/Fonts/msjhbd.ttc"
FONT_REG = "C:/Windows/Fonts/msjh.ttc"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def draw_mark(draw, cx, cy, scale):
    """與 public/logo.svg 一致的魚形標記。"""
    k = scale / 64
    p = lambda x, y: (cx - 32 * k + x * k, cy - 32 * k + y * k)

    r = 30 * k
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM, outline=DEEP, width=max(1, int(3 * k)))
    draw.ellipse([*p(12, 24), *p(43, 44)], fill=SEA)
    draw.polygon([p(41, 34), p(53, 23), p(51, 34), p(53, 45)], fill=SEA)
    er = 1.8 * k
    ex, ey = p(37, 28)
    draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=WHITE)
    draw.arc([*p(14, 38), *p(50, 50)], 180, 360, fill=GOLD, width=max(1, int(4 * k)))
    rr = 7 * k
    rx, ry = p(48, 15)
    draw.ellipse([rx - rr, ry - rr, rx + rr, ry + rr], fill=RED)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img = Image.new("RGB", (W, H), DEEP)
    d = ImageDraw.Draw(img)

    # 背景：深海底色 + 斜向漸層
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(6 + 8 * t), int(46 + 12 * t), int(53 + 14 * t)))
    d.polygon([(W * 0.52, 0), (W, 0), (W, H), (W * 0.32, H)], fill=(7, 55, 62))
    d.rectangle([0, H - 8, W, H], fill=GOLD)

    draw_mark(d, 150, 190, 190)

    f_title = font(FONT_BOLD, 60)
    f_sub = font(FONT_REG, 34)
    f_small = font(FONT_REG, 26)

    x = 96
    d.text((x, 320), "東港漁港漁產品直銷中心", font=f_title, fill=CREAM)
    d.text((x, 392), "（華僑市場）", font=f_title, fill=GOLD)
    d.text((x, 480), "臺灣屏東縣東港鎮朝隆路39號・海鮮市場・免門票", font=f_sub, fill=(190, 216, 213))
    d.text((x, 540), "huaqiaofishmarket.com｜非營利旅遊指南", font=f_small, fill=(150, 180, 178))

    img.save(OUT, "JPEG", quality=86, optimize=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
