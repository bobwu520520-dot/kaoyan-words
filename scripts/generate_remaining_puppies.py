# -*- coding: utf-8 -*-
import os, math
from PIL import Image, ImageDraw, ImageFilter

PUPPY_DIR = r"d:\谷歌反重力\kaoyan_vocab_v9\img\puppies"

def add_round_border(img, border_color=(255, 255, 255), border_width=42):
    """Ensure the avatar has a crisp circular border sticker effect"""
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    margin = 20
    draw.ellipse((margin, margin, w - margin, h - margin), fill=255)
    
    out = Image.new('RGB', (w, h), (240, 243, 246))
    out.paste(img, (0, 0), mask)
    draw_out = ImageDraw.Draw(out)
    draw_out.ellipse((margin, margin, w - margin, h - margin), outline=border_color, width=border_width)
    return out

def draw_round_glasses(img, left_eye, right_eye, radius=110, frame_color=(218, 165, 32), thickness=16):
    """Draw stylish round scholar glasses with glass glare onto eyes"""
    w, h = img.size
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    lx, ly = left_eye[0] * 2, left_eye[1] * 2
    rx, ry = right_eye[0] * 2, right_eye[1] * 2
    r = radius * 2
    th = thickness * 2
    
    # Left lens tint
    d.ellipse((lx - r, ly - r, lx + r, ly + r), fill=(255, 255, 255, 35))
    d.ellipse((rx - r, ry - r, rx + r, ry + r), fill=(255, 255, 255, 35))
    
    # Frames
    d.ellipse((lx - r, ly - r, lx + r, ly + r), outline=frame_color + (255,), width=th)
    d.ellipse((rx - r, ry - r, rx + r, ry + r), outline=frame_color + (255,), width=th)
    
    # Bridge
    d.arc((min(lx, rx) + r - 30, min(ly, ry) - 40, max(lx, rx) - r + 30, min(ly, ry) + 40), start=180, end=360, fill=frame_color + (255,), width=th)
    
    # Glass glare reflection lines
    d.line((lx - r + 40, ly - r + 70, lx - 20, ly - r + 35), fill=(255, 255, 255, 180), width=th - 4)
    d.line((rx - r + 40, ry - r + 70, rx - 20, ry - r + 35), fill=(255, 255, 255, 180), width=th - 4)
    
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    img_rgba = img.convert('RGBA')
    combined = Image.alpha_composite(img_rgba, overlay)
    return combined.convert('RGB')

def draw_graduation_cap(img, cap_pos=(512, 170), cap_scale=1.0):
    """Draw an academic graduation cap on top of puppy head"""
    w, h = img.size
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    cx, cy = int(cap_pos[0] * 2), int(cap_pos[1] * 2)
    s = cap_scale * 2
    
    # Skull cap base
    d.ellipse((cx - 180 * s, cy - 10 * s, cx + 180 * s, cy + 120 * s), fill=(25, 28, 36, 255))
    
    # Diamond mortarboard top
    pts = [
        (cx, cy - 130 * s),        # Top
        (cx + 340 * s, cy - 20 * s), # Right
        (cx, cy + 70 * s),          # Bottom
        (cx - 340 * s, cy - 20 * s)  # Left
    ]
    # Drop shadow
    shadow_pts = [(p[0], p[1] + 25 * s) for p in pts]
    d.polygon(shadow_pts, fill=(0, 0, 0, 60))
    # Cap board
    d.polygon(pts, fill=(35, 39, 48, 255))
    d.line(pts + [pts[0]], fill=(55, 60, 72, 255), width=int(10 * s))
    
    # Center golden button
    d.ellipse((cx - 24 * s, cy - 24 * s, cx + 24 * s, cy + 24 * s), fill=(245, 180, 20, 255))
    
    # Golden silk tassel
    tassel_line = [
        (cx, cy),
        (cx - 120 * s, cy + 30 * s),
        (cx - 210 * s, cy + 110 * s),
        (cx - 220 * s, cy + 230 * s)
    ]
    for i in range(len(tassel_line) - 1):
        d.line((tassel_line[i], tassel_line[i+1]), fill=(245, 180, 20, 255), width=int(12 * s))
    # Tassel fringe
    tx, ty = tassel_line[-1]
    d.polygon([
        (tx - 30 * s, ty),
        (tx + 30 * s, ty),
        (tx + 45 * s, ty + 120 * s),
        (tx - 45 * s, ty + 120 * s)
    ], fill=(245, 190, 30, 255))
    
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    img_rgba = img.convert('RGBA')
    combined = Image.alpha_composite(img_rgba, overlay)
    return combined.convert('RGB')

def draw_cheer_badge(img):
    """Draw golden victory medal and sparkles"""
    w, h = img.size
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    bx, by = w * 2 - 250, h * 2 - 250
    br = 110
    d.ellipse((bx - br - 20, by - br - 20, bx + br + 20, by + br + 20), fill=(245, 158, 11, 70))
    d.polygon([(bx - 35, by + 50), (bx - 60, by + 180), (bx - 25, by + 150), (bx - 5, by + 180), (bx - 5, by + 60)], fill=(220, 38, 38, 255))
    d.polygon([(bx + 35, by + 50), (bx + 60, by + 180), (bx + 25, by + 150), (bx + 5, by + 180), (bx + 5, by + 60)], fill=(220, 38, 38, 255))
    d.ellipse((bx - br, by - br, bx + br, by + br), fill=(251, 191, 36, 255), outline=(217, 119, 6, 255), width=16)
    d.ellipse((bx - br + 22, by - br + 22, bx + br - 22, by + br - 22), fill=(245, 158, 11, 255))
    d.text((bx - 36, by - 55), "★", fill=(255, 255, 255, 255), font_size=100)
    
    sparkles = [(300, 280), (w * 2 - 320, 320), (220, h * 2 - 300)]
    for sx, sy in sparkles:
        d.text((sx, sy), "✨", fill=(251, 191, 36, 220), font_size=90)
        
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    img_rgba = img.convert('RGBA')
    combined = Image.alpha_composite(img_rgba, overlay)
    return combined.convert('RGB')

def draw_head_tilt(img, angle=8):
    """Head tilt curiosity pose"""
    w, h = img.size
    rot = img.rotate(angle, resample=Image.Resampling.BICUBIC, fillcolor=(240, 245, 248))
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    qx, qy = int(w * 2 * 0.78), int(h * 2 * 0.22)
    d.ellipse((qx - 85, qy - 85, qx + 85, qy + 85), fill=(255, 255, 255, 240), outline=(59, 130, 246, 255), width=12)
    d.text((qx - 30, qy - 60), "?", fill=(59, 130, 246, 255), font_size=110)
    
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    combined = Image.alpha_composite(rot.convert('RGBA'), overlay)
    return combined.convert('RGB')

def draw_heart_eyes(img, left_eye, right_eye, radius=85):
    """Draw heart eyes and blushing cheeks"""
    w, h = img.size
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    bx1, by1 = left_eye[0] * 2 - 70, left_eye[1] * 2 + 150
    bx2, by2 = right_eye[0] * 2 + 70, right_eye[1] * 2 + 150
    d.ellipse((bx1 - 90, by1 - 55, bx1 + 90, by1 + 55), fill=(255, 105, 180, 110))
    d.ellipse((bx2 - 90, by2 - 55, bx2 + 90, by2 + 55), fill=(255, 105, 180, 110))
    
    for ex, ey in [left_eye, right_eye]:
        x, y = ex * 2, ey * 2
        d.text((x - radius, y - radius), "💖", fill=(255, 50, 100, 255), font_size=radius * 2)
        
    d.text((w * 2 - 280, 260), "💕", font_size=110)
    d.text((220, 300), "💗", font_size=90)
    
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    combined = Image.alpha_composite(img.convert('RGBA'), overlay)
    return combined.convert('RGB')

def draw_sleep_zzz(img):
    """Floating dreamy zzz"""
    w, h = img.size
    overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    d.text((w * 2 - 360, 190), "Z", fill=(147, 197, 253, 240), font_size=150)
    d.text((w * 2 - 270, 270), "z", fill=(167, 139, 250, 220), font_size=110)
    d.text((w * 2 - 190, 330), "z", fill=(244, 114, 182, 200), font_size=85)
    
    overlay = overlay.resize((w, h), Image.Resampling.LANCZOS)
    combined = Image.alpha_composite(img.convert('RGBA'), overlay)
    return combined.convert('RGB')

def synthesize_all():
    print("Starting full synthesis of all 30 puppy avatars...")
    # Base images
    g_base = Image.open(os.path.join(PUPPY_DIR, "golden_drool.jpg"))
    b_base = Image.open(os.path.join(PUPPY_DIR, "border_smile.jpg"))
    s_base = Image.open(os.path.join(PUPPY_DIR, "samoyed_smile.jpg"))
    
    # 1. Golden remaining
    # golden_smile: golden_bone but without bone, or golden_drool clean
    if not os.path.exists(os.path.join(PUPPY_DIR, "golden_smile.jpg")):
        g_base.save(os.path.join(PUPPY_DIR, "golden_smile.jpg"))
        print("Generated golden_smile.jpg")
        
    draw_round_glasses(g_base, (380, 410), (630, 410)).save(os.path.join(PUPPY_DIR, "golden_glasses.jpg"))
    print("Generated golden_glasses.jpg")
    
    draw_graduation_cap(g_base, (512, 170)).save(os.path.join(PUPPY_DIR, "golden_graduate.jpg"))
    print("Generated golden_graduate.jpg")
    
    draw_cheer_badge(g_base).save(os.path.join(PUPPY_DIR, "golden_cheer.jpg"))
    print("Generated golden_cheer.jpg")
    
    draw_head_tilt(g_base, 8).save(os.path.join(PUPPY_DIR, "golden_tilt.jpg"))
    print("Generated golden_tilt.jpg")
    
    # 2. Border Collie remaining
    draw_round_glasses(b_base, (400, 450), (610, 450), frame_color=(50, 50, 50)).save(os.path.join(PUPPY_DIR, "border_glasses.jpg"))
    print("Generated border_glasses.jpg")
    
    draw_graduation_cap(b_base, (512, 180)).save(os.path.join(PUPPY_DIR, "border_graduate.jpg"))
    print("Generated border_graduate.jpg")
    
    draw_cheer_badge(b_base).save(os.path.join(PUPPY_DIR, "border_cheer.jpg"))
    print("Generated border_cheer.jpg")
    
    draw_head_tilt(b_base, -8).save(os.path.join(PUPPY_DIR, "border_tilt.jpg"))
    print("Generated border_tilt.jpg")
    
    # 3. Samoyed remaining
    # Eye positions for samoyed: (405, 460) and (600, 460)
    draw_round_glasses(s_base, (405, 460), (600, 460), frame_color=(230, 170, 40)).save(os.path.join(PUPPY_DIR, "samoyed_glasses.jpg"))
    print("Generated samoyed_glasses.jpg")
    
    draw_graduation_cap(s_base, (512, 170)).save(os.path.join(PUPPY_DIR, "samoyed_graduate.jpg"))
    print("Generated samoyed_graduate.jpg")
    
    draw_cheer_badge(s_base).save(os.path.join(PUPPY_DIR, "samoyed_cheer.jpg"))
    print("Generated samoyed_cheer.jpg")
    
    draw_head_tilt(s_base, 8).save(os.path.join(PUPPY_DIR, "samoyed_tilt.jpg"))
    print("Generated samoyed_tilt.jpg")
    
    draw_heart_eyes(s_base, (405, 460), (600, 460)).save(os.path.join(PUPPY_DIR, "samoyed_love.jpg"))
    print("Generated samoyed_love.jpg")
    
    draw_sleep_zzz(s_base).save(os.path.join(PUPPY_DIR, "samoyed_sleep.jpg"))
    print("Generated samoyed_sleep.jpg")
    
    # Sleepy yawning: cute yawn overlay on samoyed
    w, h = s_base.size
    yawn_overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    yd = ImageDraw.Draw(yawn_overlay)
    yd.text((w * 2 - 340, 200), "🥱", font_size=140)
    yawn_overlay = yawn_overlay.resize((w, h), Image.Resampling.LANCZOS)
    Image.alpha_composite(s_base.convert('RGBA'), yawn_overlay).convert('RGB').save(os.path.join(PUPPY_DIR, "samoyed_sleepy.jpg"))
    print("Generated samoyed_sleepy.jpg")
    
    # Drool on samoyed:
    drool_overlay = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    dd = ImageDraw.Draw(drool_overlay)
    dd.text((w * 2 - 320, 220), "🤤", font_size=130)
    drool_overlay = drool_overlay.resize((w, h), Image.Resampling.LANCZOS)
    Image.alpha_composite(s_base.convert('RGBA'), drool_overlay).convert('RGB').save(os.path.join(PUPPY_DIR, "samoyed_drool.jpg"))
    print("Generated samoyed_drool.jpg")

if __name__ == "__main__":
    synthesize_all()
