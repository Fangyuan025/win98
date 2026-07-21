#!/usr/bin/env python3
"""Generate the app icon (1024x1024 PNG) without external deps."""
import zlib, struct, math, sys

SIZE = 1024

# 16x16 waving-flag pixel map (original art, matches the in-app Start flag)
FLAG = [
    "................",
    "................",
    "..kk............",
    ".krrkkkkgggg....",
    ".krrrkkkgggg....",
    ".krrrkkkgggg....",
    "kkrrrkkkgggg....",
    ".kkkkkkkkkkk....",
    ".kbbbkkkyyyy....",
    "kkbbbkkkyyyy....",
    ".kbbbkkkyyyy....",
    "..kbbkkkyyyy....",
    "...kk...........",
    "................",
    "................",
    "................",
]
PAL = {
    "k": (0, 0, 0, 255),
    "r": (255, 0, 0, 255),
    "g": (0, 200, 0, 255),
    "b": (0, 0, 255, 255),
    "y": (255, 255, 0, 255),
}

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def build():
    px = [[(0, 0, 0, 0)] * SIZE for _ in range(SIZE)]
    margin = 100          # macOS icons have padding around the squircle
    radius = 185
    x0, y0, x1, y1 = margin, margin, SIZE - margin, SIZE - margin

    def inside_round(x, y):
        if x < x0 or x >= x1 or y < y0 or y >= y1:
            return False
        rx0, ry0, rx1, ry1 = x0 + radius, y0 + radius, x1 - radius, y1 - radius
        cx = min(max(x, rx0), rx1)
        cy = min(max(y, ry0), ry1)
        return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2

    face = (192, 192, 192, 255)
    light = (255, 255, 255, 255)
    shadow = (110, 110, 110, 255)
    teal = (0, 128, 128, 255)
    t1 = (0, 0, 128, 255)
    t2 = (16, 132, 208, 255)

    bevel = 14
    title_h = 96
    title_top = y0 + 40
    inner_pad = 40

    for y in range(SIZE):
        for x in range(SIZE):
            if not inside_round(x, y):
                continue
            # window face with outer bevel
            c = face
            if x < x0 + bevel or y < y0 + bevel:
                c = light
            if x >= x1 - bevel or y >= y1 - bevel:
                c = shadow
            # title bar
            if title_top <= y < title_top + title_h and x0 + inner_pad <= x < x1 - inner_pad:
                t = (x - (x0 + inner_pad)) / (x1 - x0 - 2 * inner_pad)
                c = lerp(t1, t2, t)
            # desktop area below titlebar
            elif title_top + title_h + 12 <= y < y1 - inner_pad and x0 + inner_pad <= x < x1 - inner_pad:
                c = teal
            px[y][x] = c

    # flag centered in the teal area
    area_top = title_top + title_h + 12
    area_bot = y1 - inner_pad
    scale = 34
    fw = 16 * scale
    fx = (SIZE - fw) // 2
    fy = area_top + ((area_bot - area_top) - fw) // 2
    for ry in range(16):
        for rx in range(16):
            ch = FLAG[ry][rx]
            if ch == ".":
                continue
            col = PAL[ch]
            for yy in range(scale):
                for xx in range(scale):
                    X, Y = fx + rx * scale + xx, fy + ry * scale + yy
                    if 0 <= X < SIZE and 0 <= Y < SIZE and px[Y][X][3] > 0:
                        px[Y][X] = col
    return px

def write_png(path, px):
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *p) for p in row) for row in px)
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "icon_1024.png"
    write_png(out, build())
    print("wrote", out)
