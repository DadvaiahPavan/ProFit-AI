from PIL import Image
import cairosvg
import os

def generate_favicons():
    # Convert SVG to PNG
    sizes = [16, 32, 48, 64, 128, 256]
    
    for size in sizes:
        output_path = f'favicon-{size}x{size}.png'
        cairosvg.svg2png(url='favicon.svg', write_to=output_path, output_width=size, output_height=size)
        
        # Create apple touch icon (180x180)
        if size == 180:
            os.rename(output_path, 'apple-touch-icon.png')
        
    # Create main favicon.png (32x32)
    os.rename('favicon-32x32.png', 'favicon.png')

if __name__ == '__main__':
    generate_favicons()
