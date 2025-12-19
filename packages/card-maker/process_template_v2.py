from PIL import Image, ImageFilter
import os

def process_painted_template_v2(input_path, output_path):
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

    # Convert to HSV to better isolate the orange color
    # Note: PIL HSV hue is 0-255
    hsv_img = img.convert("HSV")
    hsv_pixels = hsv_img.load()
    
    # Sample key color at (0,0)
    key_h, key_s, key_v = hsv_pixels[0, 0]
    print(f"Key HSV at (0,0): H={key_h}, S={key_s}, V={key_v}")

    # Define Tolerance
    # Hue is circular, but orange is near 0/255 boundary so it's tricky if we wrap, 
    # but usually orange is around 10-20.
    H_TOL = 20  # increased tolerance for Hue
    S_TOL = 50  # Saturation usually distinct for "painted" orange
    V_TOL = 50 

    pixels = img.load()
    
    # Create a mask for non-transparent pixels
    # We will do this manually to allow "erosion" if needed
    
    print("Processing pixels with HSV keying...")
    for y in range(height):
        for x in range(width):
            h, s, v = hsv_pixels[x, y]
            
            # Check if match Key Color
            # special hue handling not strictly needed if we assume sample is representative and not near wrap-around 255->0
            # Orange is usually ~15-25 range.
            match_h = abs(h - key_h) < H_TOL
            match_s = abs(s - key_s) < S_TOL
            match_v = abs(v - key_v) < V_TOL
            
            if match_h and match_s and match_v:
                pixels[x, y] = (0, 0, 0, 0)
    
    # Remove Icon in Bottom Right
    # Heuristic: Clear a 100x100 box in bottom right?
    # Or just look for the distinct light color of the icon if it wasn't caught by orange key
    # Let's just blindly force transparent for the bottom 15% and right 15% intersection? 
    # That might cut the frame.
    # The icon is very close to the corner.
    icon_box_size = 150
    print(f"Removing bottom-right icon manually (box size {icon_box_size})...")
    for y in range(height - icon_box_size, height):
        for x in range(width - icon_box_size, width):
            pixels[x, y] = (0, 0, 0, 0)

    # Simple Erosion to clean up edges?
    # We can inspect neighbors. If a pixel is opaque but has a transparent neighbor, 
    # it might be a fringe.
    # This is expensive in Python. Let's rely on better keying first.
    # Actually, the user specifically complained about "orange sticks". 
    # This usually means anti-aliased edges that are a mix of orange + blue frame.
    # These mixed pixels have a weird Hue or low Saturation.
    # If we are strict on Hue, they might survive.
    # If we are loose on Hue, we might eat the frame.
    
    # Let's clean up "lonely" pixels or "edge" pixels.
    # A simple "erode" logic:
    # If a pixel is opaque, but has > K transparent neighbors, make it transparent.
    
    # Create a copy of the alpha channel to check neighbors
    alpha_channel = img.split()[-1]
    alpha_pixels = alpha_channel.load()
    
    print("Eroding edges to remove fringes...")
    pixels_to_clear = []
    ERODE_DEPTH = 1 # How many pixels to shave off
    
    for _ in range(ERODE_DEPTH):
        current_alpha = img.split()[-1].load() # Reload after potential changes? Or just do one pass?
        # One pass is safer for now
        
        for y in range(1, height-1):
            for x in range(1, width-1):
                if current_alpha[x, y] > 0:
                    # Check 4-neighbors
                    if current_alpha[x+1, y] == 0 or \
                       current_alpha[x-1, y] == 0 or \
                       current_alpha[x, y+1] == 0 or \
                       current_alpha[x, y-1] == 0:
                        pixels_to_clear.append((x, y))
    
    for x, y in pixels_to_clear:
         pixels[x, y] = (0, 0, 0, 0)

    # 3. Crop
    print("Cropping...")
    bbox = img.getbbox()
    if bbox:
        print(f"Original Bounds: (0, 0, {width}, {height})")
        print(f"Crop Bounds: {bbox}")
        img = img.crop(bbox)
        print(f"New dimensions: {img.size}")
    else:
        print("Warning: Entire image is transparent!")

    print(f"Saving to {output_path}")
    img.save(output_path, "PNG")

if __name__ == "__main__":
    input_file = "/Users/littledonny/.gemini/antigravity/brain/3b4c4cbf-2bd5-405b-8a2d-4727fde6b6a2/uploaded_image_1765969719950.jpg"
    output_file = "/Users/littledonny/.gemini/antigravity/brain/3b4c4cbf-2bd5-405b-8a2d-4727fde6b6a2/card_frame_orange_processed_v2.png"
    process_painted_template_v2(input_file, output_file)
