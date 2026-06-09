from PIL import Image, ImageDraw, ImageFilter
import math

def make_frame(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size

    # ── Ocean background (globe circle) ──
    ocean = (52, 120, 190, 255)       # rich blue
    d.ellipse([0, 0, s-1, s-1], fill=ocean)

    # ── Latitude / longitude grid lines (subtle) ──
    grid = (40, 100, 165, 180)
    lw = max(1, s // 64)
    cx, cy, r = s/2, s/2, s/2
    # equator
    d.line([(0, cy), (s, cy)], fill=grid, width=lw)
    # prime meridian
    d.line([(cx, 0), (cx, s)], fill=grid, width=lw)
    # two more lat lines
    for dy in [-r*0.5, r*0.5]:
        y = cy + dy
        d.line([(0, y), (s, y)], fill=grid, width=lw)

    # ── Continent blobs (approximate world shapes) ──
    land = (88, 175, 95, 255)   # forest green
    land2 = (72, 155, 78, 255)  # slightly darker for variety

    def poly(pts, col=land):
        scaled = [(x * s, y * s) for x, y in pts]
        d.polygon(scaled, fill=col)

    # North America
    poly([
        (0.08, 0.18), (0.22, 0.12), (0.30, 0.16), (0.34, 0.26),
        (0.30, 0.38), (0.24, 0.46), (0.16, 0.50), (0.10, 0.44),
        (0.06, 0.34), (0.06, 0.24),
    ])
    # Greenland
    poly([(0.22, 0.08), (0.30, 0.06), (0.33, 0.12), (0.26, 0.16), (0.20, 0.13)])
    # Central America nub
    poly([(0.22, 0.46), (0.26, 0.48), (0.24, 0.54), (0.20, 0.52)])
    # South America
    poly([
        (0.22, 0.52), (0.32, 0.50), (0.38, 0.56), (0.38, 0.68),
        (0.34, 0.80), (0.28, 0.84), (0.22, 0.78), (0.18, 0.66),
        (0.18, 0.56),
    ], col=land2)

    # Europe
    poly([
        (0.44, 0.16), (0.52, 0.12), (0.58, 0.14), (0.60, 0.22),
        (0.56, 0.28), (0.48, 0.30), (0.44, 0.26), (0.42, 0.20),
    ])
    # Scandinavia
    poly([(0.50, 0.08), (0.56, 0.06), (0.58, 0.12), (0.52, 0.14), (0.48, 0.12)])
    # UK
    poly([(0.42, 0.14), (0.46, 0.12), (0.46, 0.18), (0.42, 0.18)])

    # Africa
    poly([
        (0.46, 0.32), (0.56, 0.30), (0.62, 0.34), (0.64, 0.46),
        (0.62, 0.60), (0.58, 0.72), (0.52, 0.76), (0.46, 0.72),
        (0.42, 0.60), (0.42, 0.46), (0.44, 0.36),
    ], col=land2)

    # Asia
    poly([
        (0.58, 0.10), (0.74, 0.08), (0.88, 0.12), (0.94, 0.20),
        (0.92, 0.32), (0.86, 0.38), (0.78, 0.40), (0.66, 0.36),
        (0.60, 0.28), (0.58, 0.18),
    ])
    # Indian subcontinent
    poly([(0.68, 0.38), (0.76, 0.36), (0.78, 0.46), (0.72, 0.54), (0.66, 0.48)])
    # Southeast Asia / Indonesia (simplified)
    poly([(0.80, 0.44), (0.90, 0.42), (0.94, 0.48), (0.86, 0.52), (0.78, 0.50)])

    # Australia
    poly([
        (0.76, 0.60), (0.88, 0.58), (0.94, 0.62), (0.94, 0.72),
        (0.88, 0.78), (0.78, 0.78), (0.74, 0.72), (0.74, 0.64),
    ], col=land2)

    # Clip everything to the globe circle
    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, s-1, s-1], fill=255)
    img.putalpha(mask)

    # ── Subtle globe highlight (top-left gleam) ──
    gleam = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gleam)
    gr = int(s * 0.38)
    gx, gy = int(s * 0.30), int(s * 0.22)
    gd.ellipse([gx - gr, gy - gr, gx + gr, gy + gr], fill=(255, 255, 255, 28))
    img = Image.alpha_composite(img, gleam)

    # ── Bold red X ──
    d = ImageDraw.Draw(img)
    margin = s * 0.12
    xlw = max(3, int(s * 0.13))   # line width
    xc = (255, 38, 38, 255)       # vivid red

    # Draw thick X with rounded caps
    d.line([(margin, margin), (s - margin, s - margin)],
           fill=xc, width=xlw)
    d.line([(s - margin, margin), (margin, s - margin)],
           fill=xc, width=xlw)

    # Round caps at each X endpoint
    cap_r = xlw // 2
    for px, py in [(margin, margin), (s-margin, s-margin),
                   (s-margin, margin), (margin, s-margin)]:
        d.ellipse([px - cap_r, py - cap_r, px + cap_r, py + cap_r], fill=xc)

    # Re-apply globe clip after drawing X
    mask2 = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask2).ellipse([0, 0, s-1, s-1], fill=255)
    img.putalpha(mask2)

    return img


sizes = [256, 128, 64, 48, 32, 16]
frames = [make_frame(sz) for sz in sizes]
out_path = r"C:\Users\chris\OneDrive\Desktop\Claude\historia.ico"
frames[0].save(
    out_path, format='ICO',
    sizes=[(s, s) for s in sizes],
    append_images=frames[1:]
)
print(f"Saved {out_path}")
