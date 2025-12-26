from PIL import Image
from collections import Counter

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def analyze_image(path):
    try:
        img = Image.open(path)
        img = img.convert('RGB')
        img = img.resize((50, 50)) # Resize for speed
        
        pixels = list(img.getdata())
        # Filter out very dark or very light pixels to find the "color"
        filtered_pixels = [p for p in pixels if not (p[0]<30 and p[1]<30 and p[2]<30) and not (p[0]>230 and p[1]>230 and p[2]>230)]
        
        if not filtered_pixels:
            filtered_pixels = pixels # Fallback
            
        counter = Counter(filtered_pixels)
        most_common = counter.most_common(20)
        
        print("Dominant Colors:")
        for color, count in most_common:
            print(f"{rgb_to_hex(color)} - Count: {count}")
            
    except Exception as e:
        print(f"Error: {e}")

analyze_image('assets/logos/avatar.jpg')
