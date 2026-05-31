from PIL import Image
import os

src = r"D:\Windows\GreenSweet\Game\Sweet Home\我的鬼畜图片\GT2019.png"
base = r"D:\Windows\GreenSweet\小本本备份\抒情簿AI_Project"

img = Image.open(src)
print(f"Original size: {img.size}, mode: {img.mode}")

def resize_cover(image, size):
    s = image.copy()
    w, h = s.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    s = s.crop((left, top, left + side, top + side))
    s = s.resize((size, size), Image.LANCZOS)
    if s.mode != "RGB":
        s = s.convert("RGB")
    return s

img192 = resize_cover(img, 192)
img512 = resize_cover(img, 512)
img192.save(os.path.join(base, "icon-192.png"), "PNG")
img512.save(os.path.join(base, "icon-512.png"), "PNG")
img192.save(os.path.join(base, "mask-icon.png"), "PNG")

print(f"icon-192.png: {os.path.getsize(os.path.join(base, 'icon-192.png'))}B")
print(f"icon-512.png: {os.path.getsize(os.path.join(base, 'icon-512.png'))}B")
