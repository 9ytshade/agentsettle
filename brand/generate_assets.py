import os
import shutil
from PIL import Image, ImageDraw, ImageFont

def draw_logo_mark(draw, center_x, center_y, scale_factor, transparent=False):
    def s(coord):
        return (
            int(center_x + (coord[0] - 256) * scale_factor),
            int(center_y + (coord[1] - 256) * scale_factor)
        )

    # Ambient glow behind core
    glow_radius = int(160 * scale_factor)
    for r in range(glow_radius, 0, -max(1, int(10 * scale_factor))):
        alpha = int(35 * (1 - r / glow_radius))
        draw.ellipse([center_x - r, center_y - r, center_x + r, center_y + r], fill=(146, 129, 247, alpha))

    # Polygons
    def poly(coords, fill, outline, width):
        scaled = [s(c) for c in coords]
        draw.polygon(scaled, fill=fill, outline=outline, width=max(1, int(width * scale_factor)))

    # Left Client Bracket (Escrow Inflow)
    poly([(120, 190), (190, 120), (240, 120), (165, 195), (165, 285), (120, 330)],
         fill=(0, 0, 0, 180), outline=(240, 240, 240, 255), width=18)

    # Right Worker Bracket (Bond Inflow)
    poly([(392, 322), (322, 392), (272, 392), (347, 317), (347, 227), (392, 182)],
         fill=(0, 0, 0, 180), outline=(240, 240, 240, 255), width=18)

    # Central AI Magistrate Diamond
    poly([(256, 145), (340, 256), (256, 367), (172, 256)],
         fill=(146, 129, 247, 95), outline=(146, 129, 247, 255), width=18)
    poly([(256, 195), (300, 256), (256, 317), (212, 256)],
         fill=(186, 167, 255, 45), outline=(186, 167, 255, 255), width=8)

    # Central Equilibrium Point
    cr1 = int(22 * scale_factor)
    draw.ellipse([center_x - cr1, center_y - cr1, center_x + cr1, center_y + cr1], fill=(255, 255, 255, 255))
    cr2 = int(10 * scale_factor)
    draw.ellipse([center_x - cr2, center_y - cr2, center_x + cr2, center_y + cr2], fill=(146, 129, 247, 255))

def render_square_logo(size=512, transparent=False, out_path="logo.png"):
    supersample = 4
    canvas_size = size * supersample
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if not transparent:
        # Dark velvet container
        draw.rounded_rectangle([0, 0, canvas_size, canvas_size],
                               radius=int(96 * (size / 512) * supersample),
                               fill=(11, 14, 20, 255),
                               outline=(41, 45, 48, 255),
                               width=int(4 * (size / 512) * supersample))

    center = canvas_size // 2
    scale = (size / 512) * supersample
    draw_logo_mark(draw, center, center, scale, transparent)

    final = img.resize((size, size), Image.Resampling.LANCZOS)
    final.save(out_path, format="PNG")
    print(f"Generated: {out_path} ({size}x{size})")

def render_banner(width=1200, height=630, out_path="logo-banner-1200x630.png"):
    supersample = 2
    cw = width * supersample
    ch = height * supersample
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Ambient radial glow top center
    top_center_x = cw // 2
    top_center_y = int(ch * 0.1)
    glow_r = int(cw * 0.45)
    for r in range(glow_r, 0, -20):
        alpha = int(25 * (1 - r / glow_r))
        draw.ellipse([top_center_x - r, top_center_y - r, top_center_x + r, top_center_y + r],
                     fill=(146, 129, 247, alpha))

    # Outer border frame
    draw.rounded_rectangle([int(24 * supersample), int(24 * supersample),
                            int((width - 24) * supersample), int((height - 24) * supersample)],
                           radius=int(20 * supersample),
                           outline=(41, 45, 48, 255),
                           width=int(2 * supersample))

    # Left Logo Container
    box_x = int(110 * supersample)
    box_y = int(195 * supersample)
    box_size = int(240 * supersample)
    draw.rounded_rectangle([box_x, box_y, box_x + box_size, box_y + box_size],
                           radius=int(48 * supersample),
                           fill=(11, 14, 20, 255),
                           outline=(41, 45, 48, 255),
                           width=int(2 * supersample))

    logo_center_x = box_x + box_size // 2
    logo_center_y = box_y + box_size // 2
    draw_logo_mark(draw, logo_center_x, logo_center_y, scale_factor=0.45 * supersample)

    # Try loading a system TTF font, fallback to default
    font_large = None
    font_mid = None
    font_mono = None
    try:
        font_large = ImageFont.truetype("arial.ttf", int(68 * supersample))
        font_mid = ImageFont.truetype("arial.ttf", int(20 * supersample))
        font_mono = ImageFont.truetype("consola.ttf", int(13 * supersample))
    except Exception:
        font_large = ImageFont.load_default()
        font_mid = ImageFont.load_default()
        font_mono = ImageFont.load_default()

    text_x = int(400 * supersample)
    # Badge Pill
    badge_w = int(320 * supersample)
    badge_h = int(34 * supersample)
    badge_y = int(195 * supersample)
    draw.rounded_rectangle([text_x, badge_y, text_x + badge_w, badge_y + badge_h],
                           radius=int(17 * supersample),
                           fill=(11, 14, 20, 255),
                           outline=(41, 45, 48, 255),
                           width=int(1.5 * supersample))
    # Green dot
    dot_r = int(4 * supersample)
    dot_cx = text_x + int(18 * supersample)
    dot_cy = badge_y + badge_h // 2
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=(58, 211, 137, 255))
    draw.text((text_x + int(32 * supersample), badge_y + int(8 * supersample)),
              "GENLAYER INTELLIGENT PROTOCOL", fill=(240, 240, 240, 255), font=font_mono)

    # Title
    draw.text((text_x, int(250 * supersample)), "AgentSettle", fill=(255, 255, 255, 255), font=font_large)

    # Subtitle
    draw.text((text_x, int(338 * supersample)), "Autonomous SLA & Dispute Arbitration for AI Agents",
              fill=(161, 164, 165, 255), font=font_mid)

    # Footer line
    draw.text((text_x, int(390 * supersample)),
              "Double-Sided Collateral   |   Equivalence Principle   |   Studionet 61999",
              fill=(110, 114, 122, 255), font=font_mono)

    final = img.resize((width, height), Image.Resampling.LANCZOS)
    final.save(out_path, format="PNG")
    print(f"Generated: {out_path} ({width}x{height})")

if __name__ == "__main__":
    brand_dir = "brand"
    public_dir = os.path.join("web", "public")
    artifact_dir = r"C:\Users\9ytshade\.gemini\antigravity\brain\1a383e47-df0e-4cda-b0d0-3ac1ec5503aa"

    os.makedirs(brand_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. Square Logo (512x512)
    p512 = os.path.join(brand_dir, "logo-512x512.png")
    render_square_logo(512, transparent=False, out_path=p512)

    # 2. Ultra-high res Logo (1024x1024)
    p1024 = os.path.join(brand_dir, "logo-1024x1024.png")
    render_square_logo(1024, transparent=False, out_path=p1024)

    # 3. Transparent Square Logo (512x512)
    pt512 = os.path.join(brand_dir, "logo-transparent-512x512.png")
    render_square_logo(512, transparent=True, out_path=pt512)

    # 4. Transparent Ultra-high res Logo (1024x1024)
    pt1024 = os.path.join(brand_dir, "logo-transparent-1024x1024.png")
    render_square_logo(1024, transparent=True, out_path=pt1024)

    # 5. Presentation Banner (1200x630)
    pbanner = os.path.join(brand_dir, "logo-banner-1200x630.png")
    render_banner(1200, 630, out_path=pbanner)

    # Copy files to web/public
    shutil.copy(p512, os.path.join(public_dir, "logo.png"))
    shutil.copy(p512, os.path.join(public_dir, "logo-512x512.png"))
    shutil.copy(p1024, os.path.join(public_dir, "logo-1024x1024.png"))
    shutil.copy(p512, os.path.join(public_dir, "apple-touch-icon.png"))
    shutil.copy(pbanner, os.path.join(public_dir, "logo-banner-1200x630.png"))
    shutil.copy(pt512, os.path.join(public_dir, "logo-transparent-512x512.png"))

    # Copy files to artifact dir for instant display
    if os.path.exists(artifact_dir):
        shutil.copy(p512, os.path.join(artifact_dir, "agentsettle-logo-512x512.png"))
        shutil.copy(p1024, os.path.join(artifact_dir, "agentsettle-logo-1024x1024.png"))
        shutil.copy(pbanner, os.path.join(artifact_dir, "agentsettle-banner-1200x630.png"))
        shutil.copy(pt512, os.path.join(artifact_dir, "agentsettle-logo-transparent-512x512.png"))
        print("Copied all assets to artifact directory.")

    print("All brand assets successfully built!")
