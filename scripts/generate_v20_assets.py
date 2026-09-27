#!/usr/bin/env python3
"""
Generate ORIGINAL geometric pixel-art replacement assets for Athena Crisis fork.
Layout matches renderer contracts in hera/* and athena/info/* — not AC art.
"""
from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "v20"

TILE = 24
UNIT = 32
PORTRAIT_W, PORTRAIT_H = 55, 75  # not generated in MVP

# Player tints (ids 0–2 minimum)
PLAYER = {
    0: {"main": (120, 120, 128), "light": (168, 168, 176), "dark": (64, 64, 72), "accent": (200, 200, 208)},
    1: {"main": (180, 36, 48), "light": (220, 80, 90), "dark": (100, 16, 24), "accent": (255, 180, 80)},
    2: {"main": (40, 100, 200), "light": (80, 150, 240), "dark": (16, 48, 120), "accent": (120, 220, 255)},
}

OUTLINE = (20, 20, 28, 255)
TRANSPARENT = (0, 0, 0, 0)


def new_rgba(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), TRANSPARENT)


def px(draw: ImageDraw.ImageDraw, x: int, y: int, color, size: int = 1):
    if size == 1:
        draw.point((x, y), fill=color)
    else:
        draw.rectangle([x, y, x + size - 1, y + size - 1], fill=color)


def rect(draw, x, y, w, h, fill, outline=None):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=fill, outline=outline)


def fill_cell(img: Image.Image, cx: int, cy: int, color, cell: int = TILE):
    draw = ImageDraw.Draw(img)
    rect(draw, cx * cell, cy * cell, cell, cell, color)


def dither_cell(img: Image.Image, cx: int, cy: int, c1, c2, cell: int = TILE):
    draw = ImageDraw.Draw(img)
    ox, oy = cx * cell, cy * cell
    for y in range(cell):
        for x in range(cell):
            color = c1 if (x + y) % 2 == 0 else c2
            draw.point((ox + x, oy + y), fill=color)


def outline_rect(draw, x, y, w, h, color=OUTLINE):
    draw.rectangle([x, y, x + w - 1, y + h - 1], outline=color)


# ---------------------------------------------------------------------------
# Tiles0 — Grassland biome sheet
# Layout assumption: TileSize 24. River at (1,73) anim frames=24 offset=3 vertical
# => max source y = 73 + 23*3 = 142. Width covers Sea/AreaModifiers (~x 0..11) + margin.
# ---------------------------------------------------------------------------
def generate_tiles0() -> Image.Image:
    cols, rows = 16, 145
    img = new_rgba(cols * TILE, rows * TILE)
    draw = ImageDraw.Draw(img)

    grass = (76, 140, 64, 255)
    grass2 = (68, 128, 56, 255)
    grass3 = (88, 152, 72, 255)
    dirt = (140, 110, 70, 255)
    water = (48, 110, 180, 255)
    water2 = (56, 130, 200, 255)
    deep = (28, 70, 140, 255)
    sand = (210, 190, 120, 255)
    road = (110, 110, 118, 255)
    road_line = (160, 160, 168, 255)
    forest = (36, 100, 48, 255)
    forest_canopy = (48, 130, 60, 255)
    mountain = (130, 120, 110, 255)
    mountain_top = (200, 200, 208, 255)
    construction = (160, 140, 90, 255)
    ruins = (100, 95, 90, 255)

    # Default fill: grass (covers unknown indices safely)
    for cy in range(rows):
        for cx in range(cols):
            dither_cell(img, cx, cy, grass, grass2)

    def paint_plain(cx, cy, variant=0):
        colors = [grass3, (92, 156, 76, 255), (70, 132, 58, 255)]
        dither_cell(img, cx, cy, colors[variant % 3], grass)

    # Plain at (0,0) + variants (1,0)/(2,0)
    for i in range(3):
        paint_plain(i, 0, i)

    # ConstructionSite (0,1) + variants
    for i in range(4):
        fill_cell(img, i, 1, construction)
        d = ImageDraw.Draw(img)
        ox, oy = i * TILE, 1 * TILE
        for k in range(0, TILE, 4):
            d.line([(ox + k, oy), (ox + k, oy + TILE - 1)], fill=(120, 100, 60, 255))

    # Ruins (2,2)
    fill_cell(img, 2, 2, ruins)
    d = ImageDraw.Draw(img)
    rect(d, 2 * TILE + 4, 2 * TILE + 6, 16, 12, (80, 75, 70, 255), OUTLINE)

    # Street cluster around (3,3) — JoinableModifiers relative
    # Single uses vertical halves at (0,2) and (0,1) relative → (3,5)/(3,4)
    street_cells = {
        (3, 3), (4, 3),  # Vertical
        (0, 3), (0, 4), (0, 5),  # TopLeftCorner, TRight, BottomLeftCorner
        (1, 3), (1, 4), (1, 5),  # TBottom, JoinableCenter, TTop
        (2, 3), (2, 4), (2, 5),  # TopRight, TLeft, BottomRight
        (3, 4), (3, 5),  # TailRight/Left halves area
        (4, 4), (4, 5),  # TailDown/Up
    }
    for cx, cy in street_cells:
        fill_cell(img, cx, cy, road)
        d = ImageDraw.Draw(img)
        ox, oy = cx * TILE, cy * TILE
        d.line([(ox + 2, oy + TILE // 2), (ox + TILE - 3, oy + TILE // 2)], fill=road_line)
        d.line([(ox + TILE // 2, oy + 2), (ox + TILE // 2, oy + TILE - 3)], fill=road_line)

    # Mountain around (3,7) Joinable + alternate +4
    for base_y in (7, 11):
        for dx in range(-3, 3):
            for dy in range(0, 3):
                cx, cy = 3 + dx, base_y + dy
                if 0 <= cx < cols and 0 <= cy < rows:
                    fill_cell(img, cx, cy, mountain)
                    d = ImageDraw.Draw(img)
                    ox, oy = cx * TILE, cy * TILE
                    d.polygon(
                        [(ox + 12, oy + 4), (ox + 20, oy + 18), (ox + 4, oy + 18)],
                        fill=mountain_top,
                        outline=OUTLINE[:3],
                    )

    # Forest around (3,19) and Forest2 at +4=(3,23), Forest3 at (0,22)
    for base in [(3, 19), (3, 23), (0, 22)]:
        bx, by = base
        for dx in range(-3, 5):
            for dy in range(0, 6):
                cx, cy = bx + dx, by + dy
                if 0 <= cx < cols and 0 <= cy < rows:
                    fill_cell(img, cx, cy, forest)
                    d = ImageDraw.Draw(img)
                    ox, oy = cx * TILE, cy * TILE
                    d.ellipse([ox + 4, oy + 2, ox + 19, oy + 16], fill=forest_canopy, outline=OUTLINE[:3])
                    d.rectangle([ox + 10, oy + 14, ox + 13, oy + 21], fill=(90, 60, 30, 255))

    # Campsite (0,28)
    fill_cell(img, 0, 28, sand)
    d = ImageDraw.Draw(img)
    rect(d, 6, 28 * TILE + 8, 12, 10, (180, 60, 50, 255), OUTLINE)

    # Reef (5,18) horizontal anim frames*offset
    for f in range(4):
        for v in range(4):
            cx, cy = 5 + f, 18 + v
            if cx < cols:
                dither_cell(img, cx, cy, water, (70, 160, 170, 255))

    # Sea (8,35) AreaModifiers span x 5..11, y 34..36; anim offset 0,3,6,9
    for anim in (0, 3, 6, 9):
        for dx in range(-3, 4):
            for dy in range(-1, 3):
                cx, cy = 8 + dx, 35 + dy + anim
                if 0 <= cx < cols and 0 <= cy < rows:
                    c = water if (anim // 3 + cx + cy) % 2 == 0 else water2
                    fill_cell(img, cx, cy, c)

    # DeepSea (8,47) + anim
    for anim in (0, 3, 6, 9):
        for dx in range(-3, 4):
            for dy in range(-1, 3):
                cx, cy = 8 + dx, 47 + dy + anim
                if 0 <= cx < cols and 0 <= cy < rows:
                    fill_cell(img, cx, cy, deep)

    # Beach (3,50) anim offset 6 → 0,6,12,18
    for anim in (0, 6, 12, 18):
        for dx in range(-3, 5):
            for dy in range(-1, 5):
                cx, cy = 3 + dx, 50 + dy + anim
                if 0 <= cx < cols and 0 <= cy < rows:
                    fill_cell(img, cx, cy, sand)
                    # wet edge toward bottom
                    if dy >= 2:
                        dither_cell(img, cx, cy, sand, water2)

    # Floating edge-ish (1,41)
    for dx in range(0, 6):
        for dy in range(0, 4):
            cx, cy = 1 + dx, 41 + dy
            if cx < cols:
                dither_cell(img, cx, cy, water, grass3)

    # GasBubbles / barrels area (5,26), Barrel (0,21), Platform (0,6)
    for cx, cy, color in [
        (5, 26, water2),
        (0, 21, (160, 100, 40, 255)),
        (0, 6, (150, 150, 160, 255)),
        (0, 25, (100, 200, 220, 255)),
        (1, 25, (100, 200, 220, 255)),
        (2, 25, (100, 200, 220, 255)),
        (3, 25, (100, 200, 220, 255)),
        (4, 25, (100, 200, 220, 255)),
        (5, 25, (100, 200, 220, 255)),
    ]:
        fill_cell(img, cx, cy, color)

    # Airfield (4,1) — already construction row; paint distinct
    fill_cell(img, 4, 1, (90, 100, 110, 255))
    d = ImageDraw.Draw(img)
    d.line([(4 * TILE + 2, 1 * TILE + 12), (4 * TILE + 21, 1 * TILE + 12)], fill=(220, 220, 230, 255), width=2)

    # River (1,73) RiverModifiers + anim frames 0..69 step 3
    for anim in range(0, 70, 3):
        for dx in range(-1, 4):
            for dy in range(0, 3):
                cx, cy = 1 + dx, 73 + dy + anim
                if 0 <= cx < cols and 0 <= cy < rows:
                    shade = water2 if ((anim // 3) + dx) % 2 == 0 else water
                    fill_cell(img, cx, cy, shade)
                    # foam dots
                    d = ImageDraw.Draw(img)
                    d.point((cx * TILE + 8, cy * TILE + 10), fill=(200, 220, 255, 255))

    # Pier / Bridge-ish near (0,0) overlays already grass — paint pier strip
    for i in range(6):
        fill_cell(img, i % cols, 0 if i > 2 else 2, dirt if i < 3 else road)

    # Re-assert Plain after pier overwrite
    for i in range(3):
        paint_plain(i, 0, i)

    return img


# ---------------------------------------------------------------------------
# Buildings — 24×48 sprites (2 tiles tall). HQ player offsets to x+=22.
# Shadow sheet same layout; renderer draws cell at (x, y+1).
# ---------------------------------------------------------------------------
def draw_building(img: Image.Image, col: int, row: int, colors: dict, kind: str):
    """Draw a 24×48 building with top at (col,row) tile coords."""
    d = ImageDraw.Draw(img)
    x, y = col * TILE, row * TILE
    main, light, dark, accent = colors["main"], colors["light"], colors["dark"], colors["accent"]

    # base footprint bottom tile
    rect(d, x + 2, y + TILE + 4, 20, 18, dark)
    rect(d, x + 3, y + TILE + 5, 18, 16, main)
    # upper body
    if kind == "hq":
        rect(d, x + 4, y + 8, 16, TILE + 8, main, OUTLINE)
        rect(d, x + 6, y + 4, 12, 8, accent, OUTLINE)
        # flag
        rect(d, x + 16, y + 2, 2, 14, dark)
        d.polygon([(x + 18, y + 2), (x + 22, y + 5), (x + 18, y + 8)], fill=light)
        # windows
        for wy in (y + 14, y + 22, y + 30):
            rect(d, x + 7, wy, 4, 4, light)
            rect(d, x + 13, wy, 4, 4, light)
    elif kind == "house":
        rect(d, x + 3, y + 14, 18, TILE + 6, main, OUTLINE)
        d.polygon([(x + 2, y + 16), (x + 12, y + 6), (x + 22, y + 16)], fill=dark, outline=OUTLINE[:3])
        rect(d, x + 10, y + TILE + 8, 5, 10, dark)
        rect(d, x + 6, y + 22, 4, 4, light)
    elif kind == "factory":
        rect(d, x + 2, y + 10, 20, TILE + 10, main, OUTLINE)
        rect(d, x + 4, y + 4, 6, 10, dark, OUTLINE)
        rect(d, x + 14, y + 2, 6, 12, dark, OUTLINE)
        # smoke dots
        d.ellipse([x + 5, y + 1, x + 8, y + 4], fill=light)
        for i in range(3):
            rect(d, x + 4 + i * 6, y + 20, 4, 6, light)
    elif kind == "barracks":
        rect(d, x + 2, y + 12, 20, TILE + 8, main, OUTLINE)
        rect(d, x + 4, y + 8, 16, 6, dark)
        rect(d, x + 9, y + TILE + 6, 6, 12, dark)
        rect(d, x + 5, y + 20, 3, 3, light)
        rect(d, x + 16, y + 20, 3, 3, light)
    elif kind == "airbase":
        rect(d, x + 2, y + 16, 20, TILE + 4, main, OUTLINE)
        d.ellipse([x + 6, y + 8, x + 18, y + 20], fill=light, outline=OUTLINE[:3])
        rect(d, x + 4, y + TILE + 10, 16, 3, accent)
    elif kind == "shipyard":
        rect(d, x + 2, y + 14, 20, TILE + 6, main, OUTLINE)
        rect(d, x + 3, y + TILE + 8, 18, 6, water := (48, 110, 180, 255))
        rect(d, x + 8, y + 10, 8, 8, dark, OUTLINE)
    elif kind == "lab":
        rect(d, x + 3, y + 10, 18, TILE + 10, main, OUTLINE)
        d.ellipse([x + 8, y + 4, x + 16, y + 12], fill=accent, outline=OUTLINE[:3])
        rect(d, x + 6, y + 22, 4, 4, light)
        rect(d, x + 14, y + 22, 4, 4, light)
    elif kind == "radar":
        rect(d, x + 6, y + 18, 12, TILE, main, OUTLINE)
        d.ellipse([x + 4, y + 4, x + 20, y + 20], outline=accent[:3] if len(accent) == 4 else accent)
        d.ellipse([x + 8, y + 8, x + 16, y + 16], fill=light, outline=OUTLINE[:3])
        rect(d, x + 11, y + 16, 2, 14, dark)
    elif kind == "power":
        rect(d, x + 4, y + 12, 16, TILE + 8, main, OUTLINE)
        rect(d, x + 8, y + 4, 8, 10, accent, OUTLINE)
        d.line([(x + 10, y + 6), (x + 14, y + 12)], fill=dark, width=2)
    elif kind == "tower":
        rect(d, x + 7, y + 4, 10, TILE + 16, main, OUTLINE)
        rect(d, x + 5, y + 4, 14, 6, dark)
        rect(d, x + 9, y + 14, 3, 3, light)
        rect(d, x + 9, y + 22, 3, 3, light)
    else:  # generic
        rect(d, x + 3, y + 12, 18, TILE + 8, main, OUTLINE)
        rect(d, x + 5, y + 8, 14, 6, dark)
        rect(d, x + 8, y + 20, 4, 4, light)


def generate_buildings(player: int) -> Image.Image:
    # cols: HQ player8 at 0+22=22; Medbay 21 → 24 cols. rows: 0 top /1 bottom /2–3 spaceship
    cols, rows = 24, 4
    img = new_rgba(cols * TILE, rows * TILE)
    colors = PLAYER[player if player in PLAYER else 0]

    # Map building kinds to columns (from Building.tsx positions)
    kinds = {
        0: "hq",  # HQ base; player-colored variants also at offsets for HQ
        5: "house",
        6: "factory",
        7: "barracks",
        8: "airbase",
        9: "shipyard",
        10: "lab",
        11: "radar",
        12: "power",
        13: "tower",  # SpawnPlatform
        14: "house",  # Shelter small
        17: "house",  # Bar
        18: "factory",  # RepairShop
        20: "shipyard",  # OilRig
        21: "lab",  # Medbay
    }
    for col, kind in kinds.items():
        draw_building(img, col, 0, colors, kind)
        # spaceship biome offset y+2
        draw_building(img, col, 2, colors, kind)

    # HQ player-specific columns (same art, already player-tinted sheet)
    hq_offsets = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 15, 7: 16, 8: 22}
    for pid, ox in hq_offsets.items():
        draw_building(img, ox, 0, colors, "hq")
        draw_building(img, ox, 2, colors, "hq")

    return img


def generate_buildings_shadow() -> Image.Image:
    cols, rows = 24, 4
    img = new_rgba(cols * TILE, rows * TILE)
    d = ImageDraw.Draw(img)
    shadow = (0, 0, 0, 110)
    for col in range(cols):
        for row in (1, 3):  # bottom tile of each 2-tall building (y+1 from top at 0 or 2)
            x, y = col * TILE, row * TILE
            # elliptical blob
            d.ellipse([x + 2, y + 8, x + 21, y + 20], fill=shadow)
    return img


def generate_structures() -> Image.Image:
    cols, rows = 8, 4
    img = new_rgba(cols * TILE, rows * TILE)
    gray = {"main": (110, 110, 118), "light": (160, 160, 168), "dark": (70, 70, 78), "accent": (200, 180, 80)}
    kinds = ["tower", "tower", "airbase", "house", "factory", "shipyard", "tower"]
    for i, kind in enumerate(kinds):
        draw_building(img, i, 0, gray, kind)
        draw_building(img, i, 2, gray, kind)
    return img


def generate_structures_shadow() -> Image.Image:
    cols, rows = 8, 4
    img = new_rgba(cols * TILE, rows * TILE)
    d = ImageDraw.Draw(img)
    shadow = (0, 0, 0, 110)
    for col in range(cols):
        for row in (1, 3):
            x, y = col * TILE, row * TILE
            d.ellipse([x + 2, y + 8, x + 21, y + 20], fill=shadow)
    return img


def generate_decorators() -> Image.Image:
    # max ~ (24+17, 12+7) → use 48×24 cells
    cols, rows = 48, 24
    img = new_rgba(cols * TILE, rows * TILE)
    d = ImageDraw.Draw(img)

    def bush(cx, cy):
        x, y = cx * TILE, cy * TILE
        d.ellipse([x + 4, y + 8, x + 20, y + 22], fill=(48, 130, 60, 255), outline=OUTLINE[:3])
        d.ellipse([x + 8, y + 4, x + 18, y + 14], fill=(60, 150, 70, 255), outline=OUTLINE[:3])

    def rock(cx, cy):
        x, y = cx * TILE, cy * TILE
        d.polygon([(x + 6, y + 18), (x + 12, y + 6), (x + 20, y + 18)], fill=(130, 120, 110, 255), outline=OUTLINE[:3])

    def barrel(cx, cy):
        x, y = cx * TILE, cy * TILE
        rect(d, x + 7, y + 6, 10, 14, (160, 100, 40, 255), OUTLINE)
        rect(d, x + 7, y + 10, 10, 2, (200, 140, 60, 255))

    def box(cx, cy):
        x, y = cx * TILE, cy * TILE
        rect(d, x + 5, y + 8, 14, 12, (180, 140, 80, 255), OUTLINE)

    def sign(cx, cy):
        x, y = cx * TILE, cy * TILE
        rect(d, x + 11, y + 10, 2, 12, (90, 60, 30, 255))
        rect(d, x + 6, y + 4, 12, 8, (200, 60, 50, 255), OUTLINE)

    # Place at documented decorator positions (+ simple neighbors for .right variants)
    for base, painter in [
        ((0, 0), bush),
        ((4, 0), rock),  # TreeTrunk area
        ((8, 0), rock),  # Log
        ((12, 0), barrel),
        ((13, 0), box),
        ((15, 0), box),  # Barrier
        ((0, 1), sign),  # Ladder row
        ((4, 1), sign),
        ((12, 1), bush),  # Mushroom-ish
        ((0, 2), box),
        ((16, 2), sign),  # Pylon
        ((0, 6), rock),  # Pothole
        ((4, 5), sign),
        ((4, 6), box),
        ((4, 7), sign),
        ((6, 6), rock),
        ((10, 5), box),
        ((11, 5), bush),
        ((8, 8), sign),
        ((8, 7), box),
        ((12, 9), rock),
        ((0, 9), rock),
    ]:
        bx, by = base
        for i in range(8):
            cx = bx + i
            if cx < cols and by < rows:
                painter(cx, by)
    return img


# ---------------------------------------------------------------------------
# Units — 32×32 cells. Walk 0–7, idle 8–15. directionOffset 2 for infantry/pioneer:
# y: horiz=0, attack=1, down=2, up=4; leader +6.
# Explosion infantry/pioneer at (7,1) × 8 frames.
# ---------------------------------------------------------------------------
def draw_infantry_frame(img, col, row, colors, pose="idle", mirror_leg=0):
    d = ImageDraw.Draw(img)
    x, y = col * UNIT, row * UNIT
    main, light, dark, accent = colors["main"], colors["light"], colors["dark"], colors["accent"]
    # clear
    # body
    head = (y + 6, y + 12)
    rect(d, x + 12, y + 6, 8, 7, light, OUTLINE)  # head
    rect(d, x + 14, y + 8, 2, 2, OUTLINE)  # eye
    rect(d, x + 11, y + 13, 10, 9, main, OUTLINE)  # torso
    # gun
    if pose == "attack":
        rect(d, x + 20, y + 15, 8, 2, dark)
        rect(d, x + 26, y + 14, 2, 4, accent)
    else:
        rect(d, x + 19, y + 16, 6, 2, dark)
    # legs
    leg = 2 if mirror_leg % 2 == 0 else -2
    rect(d, x + 12, y + 22, 3, 7, dark)
    rect(d, x + 18, y + 22 + max(0, leg // 2), 3, 7, dark)
    # boots
    rect(d, x + 11, y + 28, 5, 2, OUTLINE)
    rect(d, x + 17, y + 28, 5, 2, OUTLINE)


def draw_pioneer_frame(img, col, row, colors, pose="idle", mirror_leg=0):
    d = ImageDraw.Draw(img)
    x, y = col * UNIT, row * UNIT
    main, light, dark, accent = colors["main"], colors["light"], colors["dark"], colors["accent"]
    rect(d, x + 12, y + 6, 8, 7, light, OUTLINE)
    rect(d, x + 14, y + 8, 2, 2, OUTLINE)
    rect(d, x + 11, y + 13, 10, 9, main, OUTLINE)
    # tool / wrench
    rect(d, x + 20, y + 14, 2, 8, dark)
    rect(d, x + 19, y + 13, 4, 3, accent, OUTLINE)
    # backpack
    rect(d, x + 8, y + 14, 4, 7, dark, OUTLINE)
    leg = 2 if mirror_leg % 2 == 0 else -2
    rect(d, x + 12, y + 22, 3, 7, dark)
    rect(d, x + 18, y + 22 + max(0, leg // 2), 3, 7, dark)
    rect(d, x + 11, y + 28, 5, 2, OUTLINE)
    rect(d, x + 17, y + 28, 5, 2, OUTLINE)


def draw_tank_frame(img, col, row, colors, pose="idle", frame=0):
    d = ImageDraw.Draw(img)
    x, y = col * UNIT, row * UNIT
    main, light, dark, accent = colors["main"], colors["light"], colors["dark"], colors["accent"]
    # treads
    rect(d, x + 4, y + 20, 24, 8, dark, OUTLINE)
    for i in range(5):
        rect(d, x + 6 + i * 4 + (frame % 2), y + 22, 2, 4, light)
    # hull
    rect(d, x + 6, y + 12, 20, 10, main, OUTLINE)
    # turret
    rect(d, x + 10, y + 8, 12, 8, light, OUTLINE)
    # barrel pointing left (sprite direction 'left')
    rect(d, x + 2, y + 10, 10, 3, dark, OUTLINE)
    rect(d, x + 2, y + 9, 3, 5, accent)


def draw_explosion_cell(img, col, row, frame):
    d = ImageDraw.Draw(img)
    x, y = col * UNIT, row * UNIT
    # expanding burst
    t = frame / 7.0
    r = int(2 + t * 12)
    colors = [(255, 220, 80, 255), (255, 140, 40, 255), (200, 60, 30, 255), (80, 80, 80, 200)]
    c = colors[min(frame // 2, 3)]
    cx, cy = x + 16, y + 16
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    if frame < 5:
        d.ellipse([cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2], fill=(255, 255, 200, 255))


def generate_unit_sheet(kind: str, player: int) -> Image.Image:
    # 16 cols × 12 rows covers walk/idle, directions, leader, explosion
    cols, rows = 16, 12
    img = new_rgba(cols * UNIT, rows * UNIT)
    colors = PLAYER[player if player in PLAYER else 0]
    drawers = {"Infantry": draw_infantry_frame, "Pioneer": draw_pioneer_frame, "SmallTank": draw_tank_frame}
    draw_fn = drawers[kind]
    dir_offset = 1 if kind == "SmallTank" else 2

    # For each facing row group (base and leader)
    for leader in (0, 1):
        base_y = leader * 6
        # horizontal walk + idle
        for f in range(8):
            draw_fn(img, f, base_y, colors, "idle", f)
            draw_fn(img, f + 8, base_y, colors, "idle", 0)  # idle bob = same
        # attack row (infantry) at base_y+1
        if kind == "Infantry":
            for f in range(8):
                draw_fn(img, f, base_y + 1, colors, "attack", f)
            # explosion frames at (7,1) relative to unit sheet origin — absolute col 7, row base_y+1
            # Actually explosion position is absolute sprite(7,1) on sheet, NOT relative to leader.
            # Only non-leader explosion at (7,1). Still paint for leader row too for safety.
        # down
        down_y = base_y + 1 * dir_offset
        for f in range(8):
            draw_fn(img, f, down_y if kind == "SmallTank" else base_y + 2, colors, "idle", f)
            draw_fn(img, f + 8, down_y if kind == "SmallTank" else base_y + 2, colors, "idle", 0)
        # up
        up_y = base_y + 2 * dir_offset
        for f in range(8):
            draw_fn(img, f, up_y if kind == "SmallTank" else base_y + 4, colors, "idle", f)
            draw_fn(img, f + 8, up_y if kind == "SmallTank" else base_y + 4, colors, "idle", 0)

    # Explosion strip for infantry/pioneer at (8,1) × 8 frames (cols 8..15, row 1)
    # Starts at col 8 so attack-stance frames on cols 0..7 are not overwritten.
    if kind in ("Infantry", "Pioneer"):
        for f in range(8):
            x0, y0 = (8 + f) * UNIT, 1 * UNIT
            patch = new_rgba(UNIT, UNIT)
            img.paste(patch, (x0, y0))
            draw_explosion_cell(img, 8 + f, 1, f)

    return img


def generate_unit_shadow(kind: str) -> Image.Image:
    cols, rows = 16, 12
    img = new_rgba(cols * UNIT, rows * UNIT)
    d = ImageDraw.Draw(img)
    shadow = (0, 0, 0, 140)
    for row in range(rows):
        for col in range(cols):
            x, y = col * UNIT, row * UNIT
            if kind == "SmallTank":
                d.ellipse([x + 4, y + 22, x + 28, y + 30], fill=shadow)
            else:
                d.ellipse([x + 8, y + 24, x + 24, y + 31], fill=shadow)
    return img


# ---------------------------------------------------------------------------
# Cursor 26×26, 4 frames × 2 rows (red at y=26). Anim to -104px → width >= 104
# ---------------------------------------------------------------------------
def generate_cursor() -> Image.Image:
    w, h = 26 * 4, 26 * 2  # 104×52
    img = new_rgba(w, h)
    d = ImageDraw.Draw(img)

    def frame(ox, oy, color, inset):
        # corner brackets
        s = 26
        m = 2 + inset
        c = color
        # TL
        d.rectangle([ox + m, oy + m, ox + m + 6, oy + m + 1], fill=c)
        d.rectangle([ox + m, oy + m, ox + m + 1, oy + m + 6], fill=c)
        # TR
        d.rectangle([ox + s - m - 7, oy + m, ox + s - m - 1, oy + m + 1], fill=c)
        d.rectangle([ox + s - m - 2, oy + m, ox + s - m - 1, oy + m + 6], fill=c)
        # BL
        d.rectangle([ox + m, oy + s - m - 2, ox + m + 6, oy + s - m - 1], fill=c)
        d.rectangle([ox + m, oy + s - m - 7, ox + m + 1, oy + s - m - 1], fill=c)
        # BR
        d.rectangle([ox + s - m - 7, oy + s - m - 2, ox + s - m - 1, oy + s - m - 1], fill=c)
        d.rectangle([ox + s - m - 2, oy + s - m - 7, ox + s - m - 1, oy + s - m - 1], fill=c)

    for i in range(4):
        frame(i * 26, 0, (255, 255, 255, 255), i % 2)
        frame(i * 26, 26, (220, 40, 40, 255), i % 2)
    return img


def generate_effect_strip(cell: int, frames: int, style: str) -> Image.Image:
    img = new_rgba(cell, cell * frames)
    d = ImageDraw.Draw(img)
    for f in range(frames):
        y = f * cell
        t = f / max(frames - 1, 1)
        cx, cy = cell // 2, y + cell // 2
        if style == "explosion":
            # 3 horizontal cels used via Animation cell=; we only need vertical strip width=cell
            # Actually Explosion uses backgroundPosition with cell horizontal: generateFrames vertical
            # and Animation cell shifts X. So sheet is width = cell * numCels, height = cell * frames
            pass
        elif style == "heal":
            r = int(4 + t * 10)
            alpha = int(255 * (1 - t * 0.7))
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(80, 220, 120, alpha))
            d.rectangle([cx - 1, cy - 6, cx + 1, cy + 6], fill=(120, 255, 160, alpha))
            d.rectangle([cx - 6, cy - 1, cx + 6, cy + 1], fill=(120, 255, 160, alpha))
        elif style == "damage":
            r = int(2 + t * 14)
            col = (255, int(200 * (1 - t)), 40, 255)
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
            if f < frames // 2:
                d.ellipse([cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2], fill=(255, 255, 180, 255))
        elif style == "spawn":
            r = int(16 * (1 - abs(t - 0.5) * 2) + 2)
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(180, 220, 255, 255))
            d.ellipse([cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2], fill=(100, 160, 255, 180))
        elif style == "capture":
            # 7×7 icon sheet — make a small flag strip; use 16×N for safety, CSS shows 7×7
            pass
    return img


def generate_explosion() -> Image.Image:
    # vertical frames; Animation `cell` selects horizontal column (0..2 used)
    cell, frames, cels = 72, 20, 3
    img = new_rgba(cell * cels, cell * frames)
    d = ImageDraw.Draw(img)
    for cel in range(cels):
        for f in range(frames):
            x0, y0 = cel * cell, f * cell
            t = f / (frames - 1)
            cx, cy = x0 + cell // 2, y0 + cell // 2
            r = int(4 + t * 28)
            palette = [
                (255, 240, 120, 255),
                (255, 160, 40, 255),
                (220, 60, 30, 255),
                (60, 60, 60, 200),
            ]
            c = palette[min(int(t * 4), 3)]
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
            if f < 12:
                d.ellipse([cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3], fill=(255, 255, 220, 255))
            # sparks
            for k in range(4):
                ang = k * math.pi / 2 + t * 2
                sx = int(cx + math.cos(ang) * r * 0.8)
                sy = int(cy + math.sin(ang) * r * 0.8)
                d.point((sx, sy), fill=(255, 220, 100, 255))
    return img



# ---------------------------------------------------------------------------
# Attack VFX — vertical strips matching WeaponAnimation size/frames/cell.
# Animation.tsx: viewport = size×size; frames shift backgroundPositionY by -i*size;
# cell shifts backgroundPositionX by -cell*size. Empty is intentionally blank.
# ---------------------------------------------------------------------------

# sprite -> (size, frames, cels) aggregated from athena/info/Unit.tsx WeaponAnimation
ATTACK_SHEETS = {
    "Acid": (36, 11, 1),
    "AcidCloud": (36, 8, 1),
    "Amphibious": (32, 15, 1),
    "AntiAir": (24, 8, 1),
    "Artillery": (32, 9, 1),
    "Bite": (64, 9, 1),
    "Bomb": (24, 9, 1),
    "Cannon": (80, 14, 1),
    "Empty": (32, 16, 1),  # timing-only; fully transparent
    "ExplosionImpact": (48, 10, 1),
    "Flamethrower": (32, 24, 2),
    "Flask": (48, 20, 1),
    "FlaskExplosion": (32, 8, 1),
    "HeavyArtillery": (32, 12, 1),
    "LightGun": (36, 13, 1),
    "MG": (32, 8, 1),
    "Minigun": (32, 11, 1),
    "Pistol": (32, 10, 1),
    "Pow": (64, 7, 1),
    "Punch": (42, 11, 1),
    "Railgun": (48, 23, 1),
    "RailgunImpact": (64, 16, 1),
    "Rocket": (64, 16, 1),
    "RocketLauncher": (32, 11, 1),
    "Rockets": (48, 9, 1),
    "SAM": (32, 12, 1),
    "SAMImpact": (42, 12, 1),
    "Shotgun": (32, 17, 1),
    "Smoke": (40, 9, 1),
    "SniperRifle": (32, 14, 1),
    "Spark": (32, 11, 1),
    "SparkMini": (32, 9, 1),
    "Torpedo": (32, 14, 2),
}


def _attack_palette(style: str, t: float, cel: int = 0):
    """Crimson/orange geometric flash — original, not AC art."""
    # Early frames bright muzzle; mid orange; late crimson fade
    if style == "smoke":
        a = int(180 * (1 - t))
        g = int(160 + 40 * (1 - t))
        return (g, g, g, a)
    if style == "spark":
        a = int(255 * (1 - t * 0.85))
        return (255, int(220 - 100 * t), int(80 + 40 * t), a)
    if style == "impact":
        a = int(255 * (1 - t * 0.7))
        return (255, int(120 + 80 * (1 - t)), int(30 + 20 * (1 - t)), a)
    if style == "flame":
        # cel 0 = core, cel 1 = outer tongue
        a = int((220 if cel == 0 else 160) * (1 - t * 0.6))
        return (255, int(160 - 40 * cel - 60 * t), int(40 + 20 * cel), a)
    # default muzzle / burst
    a = int(255 * (1 - t * 0.75))
    return (220, int(40 + 100 * (1 - t)), int(28 + 20 * (1 - t)), a)


def _attack_style_for(name: str) -> str:
    n = name.lower()
    if name == "Empty":
        return "empty"
    if "smoke" in n or "cloud" in n:
        return "smoke"
    if "spark" in n or name in ("Pow", "Punch", "Bite"):
        return "spark"
    if "impact" in n or "explosion" in n or name in ("Bomb", "FlaskExplosion"):
        return "impact"
    if "flame" in n:
        return "flame"
    return "muzzle"


def draw_attack_frame(d: ImageDraw.ImageDraw, x0: int, y0: int, cell: int, f: int, frames: int, style: str, cel: int = 0):
    if style == "empty":
        return
    t = f / max(frames - 1, 1)
    cx, cy = x0 + cell // 2, y0 + cell // 2
    color = _attack_palette(style, t, cel)
    # Expand then contract: peak mid-early
    peak = 0.35
    grow = 1 - abs(t - peak) / max(peak, 1 - peak)
    grow = max(0.15, grow)
    r = max(2, int((cell * 0.12) + grow * (cell * 0.32)))

    if style == "muzzle":
        # horizontal-ish muzzle flash (animation rotates for direction)
        hw = max(2, int(r * 1.4))
        hh = max(1, int(r * 0.55))
        d.ellipse([cx - hw, cy - hh, cx + hw, cy + hh], fill=color)
        core = (255, 240, 180, color[3])
        d.ellipse([cx - hw // 2, cy - hh // 2, cx + hw // 2, cy + hh // 2], fill=core)
        # pixel sparks
        for k in range(4):
            ang = k * math.pi / 2 + t * 3
            sx = int(cx + math.cos(ang) * (hw + 2))
            sy = int(cy + math.sin(ang) * (hh + 2))
            d.point((sx, sy), fill=(255, 200, 80, color[3]))
    elif style == "impact":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
        if f < frames * 0.6:
            d.ellipse([cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3], fill=(255, 255, 200, color[3]))
        # cross burst
        arm = max(2, r // 2)
        d.rectangle([cx - 1, cy - arm, cx + 1, cy + arm], fill=(255, 180, 60, color[3]))
        d.rectangle([cx - arm, cy - 1, cx + arm, cy + 1], fill=(255, 180, 60, color[3]))
    elif style == "spark":
        for k in range(6):
            ang = k * math.pi / 3 + t * 2
            length = int(r * (0.6 + 0.4 * grow))
            sx = int(cx + math.cos(ang) * length)
            sy = int(cy + math.sin(ang) * length)
            d.line([cx, cy, sx, sy], fill=color, width=max(1, cell // 16))
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(255, 255, 220, color[3]))
    elif style == "flame":
        # tongue extending rightward (cel 1 longer)
        length = int(r * (1.2 + 0.8 * cel) * grow)
        height = max(2, int(r * 0.7))
        d.ellipse([cx - 2, cy - height, cx + length, cy + height], fill=color)
        d.ellipse([cx - 1, cy - height // 2, cx + length // 2, cy + height // 2], fill=(255, 240, 120, color[3]))
    elif style == "smoke":
        for i, off in enumerate(((-2, -1), (2, 1), (0, -3))):
            rr = max(2, int(r * (0.7 + 0.2 * i) * (1 - t * 0.3)))
            d.ellipse(
                [cx + off[0] - rr, cy + off[1] - rr - int(t * 4), cx + off[0] + rr, cy + off[1] + rr - int(t * 4)],
                fill=color,
            )


def generate_attack_sheet(name: str, size: int, frames: int, cels: int = 1) -> Image.Image:
    img = new_rgba(size * cels, size * frames)
    d = ImageDraw.Draw(img)
    style = _attack_style_for(name)
    for cel in range(cels):
        for f in range(frames):
            draw_attack_frame(d, cel * size, f * size, size, f, frames, style, cel)
    return img


def generate_attack_octopus(player: int) -> Image.Image:
    # AttackOctopus WeaponAnimation: size 32, frames 16
    size, frames = 32, 16
    img = new_rgba(size, size * frames)
    d = ImageDraw.Draw(img)
    colors = PLAYER.get(player, PLAYER[0])
    for f in range(frames):
        y = f * size
        t = f / max(frames - 1, 1)
        cx, cy = size // 2, y + size // 2
        # geometric tentacle whip / bite flash in player tint + crimson
        r = int(4 + abs(0.4 - t) * 20)
        whip = colors["main"] + (int(230 * (1 - t * 0.5)),)
        d.ellipse([cx - r, cy - r // 2, cx + r + int(6 * (1 - t)), cy + r // 2], fill=whip)
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=colors["accent"] + (255,))
        if f < 10:
            d.rectangle([cx + r // 2, cy - 1, cx + r + 4, cy + 1], fill=(220, 40, 40, 200))
    return img


def generate_heal() -> Image.Image:
    return generate_effect_strip(36, 18, "heal")


def generate_damage() -> Image.Image:
    return generate_effect_strip(48, 18, "damage")


def generate_spawn(player: int) -> Image.Image:
    cell, frames = 48, 18
    img = new_rgba(cell, cell * frames)
    d = ImageDraw.Draw(img)
    colors = PLAYER[player if player in PLAYER else 1]
    for f in range(frames):
        y = f * cell
        t = f / (frames - 1)
        cx, cy = cell // 2, y + cell // 2
        r = int(2 + abs(0.5 - t) * 2 * 18)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=colors["light"] + (255,))
        d.ellipse(
            [cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2],
            fill=colors["main"] + (160,),
        )
    return img


def generate_capture(player: int) -> Image.Image:
    # Used as 7×7 icon via CSS; provide a small vertical strip of flag icons
    cell, frames = 7, 2
    img = new_rgba(cell, cell * frames)
    d = ImageDraw.Draw(img)
    colors = PLAYER[player if player in PLAYER else 1]
    for f in range(frames):
        y = f * cell
        d.rectangle([1, y + 1, 2, y + 6], fill=(40, 40, 40, 255))
        d.rectangle([2, y + 1, 5, y + 4], fill=colors["main"] + (255,))
    return img


def save(img: Image.Image, rel: str):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"WROTE {rel} {img.size[0]}x{img.size[1]}")
    return path, img.size


def main():
    written = []
    written.append(save(generate_tiles0(), "assets/render/Tiles0.png"))
    written.append(save(generate_buildings_shadow(), "BuildingsShadow-0.png"))
    written.append(save(generate_structures_shadow(), "StructuresShadow-0.png"))
    written.append(save(generate_decorators(), "Decorators-0.png"))
    for p in (0, 1, 2):
        written.append(save(generate_buildings(p), f"Buildings-{p}.png"))
    written.append(save(generate_structures(), "assets/Structures.png"))
    for kind in ("Infantry", "Pioneer", "SmallTank"):
        for p in (1, 2):
            written.append(save(generate_unit_sheet(kind, p), f"Units-{kind}-{p}.png"))
    written.append(save(generate_unit_shadow("Infantry"), "assets/shadow/Units-Infantry.png"))
    written.append(save(generate_unit_shadow("Pioneer"), "assets/shadow/Units-Pioneer.png"))
    # SmallTank has no ShadowImages entry — skip
    written.append(save(generate_cursor(), "assets/Cursor.png"))
    written.append(save(generate_explosion(), "assets/Explosion.png"))
    # Attack sheets — must match WeaponAnimation size/frames/cell
    for name, (size, frames, cels) in ATTACK_SHEETS.items():
        written.append(save(generate_attack_sheet(name, size, frames, cels), f"assets/Attack{name}.png"))
    for p in range(0, 9):
        written.append(save(generate_attack_octopus(p if p in PLAYER else 0), f"AttackOctopus-{p}.png"))
        # waterSwap biome variants (Biomes 0..6 present as stubs)
        for b in range(0, 7):
            written.append(save(generate_attack_octopus(p if p in PLAYER else 0), f"AttackOctopus-{p}-{b}.png"))

    written.append(save(generate_heal(), "assets/Heal.png"))
    written.append(save(generate_damage(), "assets/Damage.png"))
    written.append(save(generate_spawn(1), "Spawn-1.png"))
    written.append(save(generate_capture(1), "Capture-1.png"))
    # also spawn/capture for player 2 to avoid easy 404 in 2p
    written.append(save(generate_spawn(2), "Spawn-2.png"))
    written.append(save(generate_capture(2), "Capture-2.png"))

    print("--- SUMMARY ---")
    for path, size in written:
        print(f"{path.relative_to(OUT)}: {size[0]}x{size[1]}")
    print(f"OUT_ROOT={OUT}")


if __name__ == "__main__":
    main()
