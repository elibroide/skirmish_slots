from PIL import Image
import os

def process_painted_template(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        return

    print(f"Opening {input_path}")
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open image: {e}")
        return

    width, height = img.size
    print(f"Image dimensions: {width}x{height}")
    pixels = img.load()

    # 1. Identify Orange Key Color from (0,0)
    key_color = pixels[0, 0]
    print(f"Key color (Orange) at (0,0): {key_color}")

    # Helper for color distance
    def color_dist(c1, c2):
        return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))

    THRESHOLD = 100

    # 2. Iterate and replace orange with transparent
    # We'll also keep track of bounds for cropping manually if needed, 
    # but PIL.Image.getbbox() handles transparency cropping nicely.
    
    print("Processing pixels...")
    for y in range(height):
        for x in range(width):
            current_color = pixels[x, y]
            if color_dist(key_color, current_color) < THRESHOLD:
                pixels[x, y] = (0, 0, 0, 0)

    # 3. Crop
    print("Cropping...")
    bbox = img.getbbox()
    if bbox:
        print(f"Original Bounds: (0, 0, {width}, {height})")
        print(f"Crop Bounds: {bbox}")
        img = img.crop(bbox)
        # Verify new size
        print(f"New dimensions: {img.size}")
    else:
        print("Warning: Entire image is transparent!")

    print(f"Saving to {output_path}")
    img.save(output_path, "PNG")

if __name__ == "__main__":
    input_file = "/Users/littledonny/.gemini/antigravity/brain/3b4c4cbf-2bd5-405b-8a2d-4727fde6b6a2/uploaded_image_1765969719950.jpg"
    output_file = "/Users/littledonny/.gemini/antigravity/brain/3b4c4cbf-2bd5-405b-8a2d-4727fde6b6a2/card_frame_orange_processed.png"
    process_painted_template(input_file, output_file)
