import os
import sys
import io
import json
import imghdr
import tempfile
from PIL import Image
from fpdf import FPDF
from bs4 import BeautifulSoup
import cloudscraper

def extract_images_from_html(html_content):
    print("Extracting images from HTML...")
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    for img_tag in soup.find_all('img'):
        src = img_tag.get('src')
        if src:
            images.append(src)
    print(f"Found {len(images)} images.")
    return images

def download_images_from_urls(urls, output_path):
    print(f"Starting to download images for {len(urls)} URLs...")

    pdf = FPDF()
    scraper = cloudscraper.create_scraper()  # ✅ Initialisation de cloudscraper

    for url in urls:
        url = url.strip()
        print(f"Processing URL: {url}")
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': url,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
            response = scraper.get(url, headers=headers)  # ✅ Utilisation de cloudscraper
            if response.status_code == 200:
                print(f"Successfully fetched HTML content for {url}")
                html_content = response.text
                images = extract_images_from_html(html_content)
                for image_url in images:
                    try:
                        print(f"Downloading image from {image_url}")
                        image_headers = {
                            'User-Agent': headers['User-Agent'],
                            'Referer': url,
                            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                        }
                        image_response = scraper.get(image_url, headers=image_headers)  # ✅ cloudscraper ici aussi
                        if image_response.status_code == 200:
                            image_data = image_response.content
                            if imghdr.what(None, h=image_data) is not None:
                                with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_image_file:
                                    temp_image_file.write(image_data)
                                print(f"Image saved temporarily to {temp_image_file.name}")
                                image = Image.open(temp_image_file.name)
                                jpeg_path = temp_image_file.name.replace('.png', '.jpg')
                                image = image.convert('RGB')
                                image.save(jpeg_path, 'JPEG')
                                print(f"Converted image saved to {jpeg_path}")
                                pdf.add_page()
                                pdf.image(jpeg_path, 10, 10, 190, 277)
                                image.close()
                                os.unlink(temp_image_file.name)
                                os.unlink(jpeg_path)
                            else:
                                print(f"Invalid image format: {image_url}")
                        else:
                            print(f"Failed to download image from {image_url}, status code: {image_response.status_code}")
                    except Exception as img_err:
                        print(f"Error downloading image: {image_url} => {img_err}")
            else:
                print(f"Failed to load page {url}, status code: {response.status_code}")
        except Exception as page_err:
            print(f"Error loading page: {url} => {page_err}")

    print(f"Saving PDF to {output_path}...")
    pdf.output(output_path)
    print(f"PDF saved successfully to {output_path}")

if __name__ == "__main__":
    print(f"Starting script {sys.argv[0]}...")

    if len(sys.argv) != 3:
        print("Usage: dl_pdf.py '[\"url1\", \"url2\"]' output_path")
        sys.exit(1)

    try:
        urls = json.loads(sys.argv[1])
        output_path = sys.argv[2]
        print(f"Parsed URLs: {urls}")
        print(f"Output PDF path: {output_path}")
        download_images_from_urls(urls, output_path)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)
