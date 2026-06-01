from PIL import Image
import os

src = r"D:\Windows\GreenSweet\Game\Sweet Home\我的鬼畜图片\GT2019.png"
base = r"D:\Windows\GreenSweet\小本本备份\抒情簿AI_Project"

img = Image.open(src).convert("RGBA")
print(f"Original size: {img.size}")

def make_icon(image, size, padding=0.1):
    # White background
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))

    # Crop original to square (center)
    w, h = image.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    square = image.crop((left, top, left + side, top + side))

    # Scale to (size * (1 - 2*padding))
    target = int(size * (1 - 2 * padding))
    square = square.resize((target, target), Image.LANCZOS)

    # Paste centered on white canvas
    x = (size - target) // 2
    y = (size - target) // 2
    if square.mode == "RGBA":
        canvas.paste(square, (x, y), square)
    else:
        canvas.paste(square, (x, y))

    return canvas.convert("RGB")

img192 = make_icon(img, 192, padding=0.12)
img512 = make_icon(img, 512, padding=0.12)
img192.save(os.path.join(base, "icon-192.png"), "PNG")
img512.save(os.path.join(base, "icon-512.png"), "PNG")

print(f"icon-192.png: {os.path.getsize(os.path.join(base, 'icon-192.png'))}B")
print(f"icon-512.png: {os.path.getsize(os.path.join(base, 'icon-512.png'))}B")
