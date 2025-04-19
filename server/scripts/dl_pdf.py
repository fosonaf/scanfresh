import os
import requests
import io
from PIL import Image
from fpdf import FPDF
from bs4 import BeautifulSoup
import imghdr
import tempfile

def extract_images_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    for img_tag in soup.find_all('img'):
        src = img_tag.get('src')
        if src:
            images.append(src)
    return images

def download_images_from_urls(urls: list[str], output_path: str):
    pdf = FPDF()

    for url in urls:
        url = url.strip()
        if not url:
            continue

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
            continue

        html_content = response.text
        images = extract_images_from_html(html_content)

        for image_url in images:
            try:
                image_response = requests.get(image_url, timeout=10)
                image_response.raise_for_status()
                image_data = image_response.content
                if imghdr.what(None, h=image_data):
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_image_file:
                        temp_image_file.write(image_data)
                    image = Image.open(temp_image_file.name).convert('RGB')
                    jpeg_path = temp_image_file.name.replace('.png', '.jpg')
                    image.save(jpeg_path, 'JPEG')
                    pdf.add_page()
                    pdf.image(jpeg_path, 10, 10, 190, 277)
                    image.close()
                    os.unlink(temp_image_file.name)
                    os.unlink(jpeg_path)
            except Exception as e:
                print(f"Error processing image {image_url}: {e}")
                continue

    pdf.output(output_path)
    return output_path
