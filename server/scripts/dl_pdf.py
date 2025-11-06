import os
import sys
import io
import json
import tempfile
import traceback
from PIL import Image
from fpdf import FPDF
from bs4 import BeautifulSoup
import cloudscraper
from urllib.parse import urljoin

def log(message):
    """Log vers stderr pour déboguer"""
    print(f"[DEBUG] {message}", file=sys.stderr, flush=True)

def detect_image_type(image_data):
    """Détecte le type d'image à partir des magic bytes (remplace imghdr)"""
    if image_data.startswith(b'\xff\xd8\xff'):
        return 'jpeg'
    elif image_data.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    elif image_data.startswith(b'GIF87a') or image_data.startswith(b'GIF89a'):
        return 'gif'
    elif image_data.startswith(b'RIFF') and image_data[8:12] == b'WEBP':
        return 'webp'
    elif image_data.startswith(b'BM'):
        return 'bmp'
    try:
        img = Image.open(io.BytesIO(image_data))
        return img.format.lower() if img.format else None
    except:
        return None

def extract_images_from_html(html_content):
    log("Extracting images from HTML...")
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    for img_tag in soup.find_all('img'):
        src = img_tag.get('src')
        if src:
            # Gérer les URLs relatives
            if src.startswith('//'):
                src = 'https:' + src
            elif src.startswith('/'):
                log(f"Warning: relative URL found: {src}")
            images.append(src)
    log(f"Found {len(images)} images.")
    return images

def download_images_from_urls(urls, output_path):
    log(f"Starting to download images for {len(urls)} URLs...")
    log(f"Output path: {output_path}")
    log(f"Temp directory: {tempfile.gettempdir()}")

    pdf = FPDF()

    try:
        scraper = cloudscraper.create_scraper()
        log("Cloudscraper initialized successfully")
    except Exception as e:
        log(f"ERROR: Failed to initialize cloudscraper: {e}")
        raise

    for i, url in enumerate(urls):
        if "https://scanfresh.onrender.com" in url:
            urls[i] = url.replace("https://scanfresh.onrender.com", "http://localhost:10000")
            log(f"Replaced public URL with localhost: {urls[i]}")

    total_images_added = 0

    for idx, url in enumerate(urls):
        url = url.strip()
        log(f"[{idx+1}/{len(urls)}] Processing URL: {url}")

        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': url,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }

            log(f"Fetching HTML from {url}...")
            response = scraper.get(url, headers=headers, timeout=30)
            log(f"Response status: {response.status_code}")

            if response.status_code == 200:
                html_content = response.text
                log(f"HTML content length: {len(html_content)} bytes")

                images = extract_images_from_html(html_content)

                if not images:
                    log(f"WARNING: No images found on {url}")
                    continue

                # Remplacer les images publiques par localhost
                for j, img_url in enumerate(images):
                    if img_url.startswith("https://scanfresh.onrender.com"):
                        images[j] = img_url.replace("https://scanfresh.onrender.com", "http://localhost:10000")
                        log(f"Image URL replaced with localhost: {images[j]}")

                for img_idx, image_url in enumerate(images):
                    try:
                        # Gérer les URLs relatives
                        if image_url.startswith('//'):
                            image_url = 'https:' + image_url
                        elif image_url.startswith('/'):
                            image_url = urljoin(url, image_url)

                        log(f"  [{img_idx+1}/{len(images)}] Downloading image: {image_url}")

                        image_headers = {
                            'User-Agent': headers['User-Agent'],
                            'Referer': url,
                            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                        }

                        image_response = scraper.get(image_url, headers=image_headers, timeout=20)

                        if image_response.status_code == 200:
                            image_data = image_response.content
                            log(f"    Downloaded {len(image_data)} bytes")

                            # Vérifier le format de l'image
                            img_type = detect_image_type(image_data)
                            if img_type is None:
                                log(f"    WARNING: Invalid image format, skipping")
                                continue

                            log(f"    Image type: {img_type}")

                            # Sauvegarder temporairement
                            with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as temp_image_file:
                                temp_image_file.write(image_data)
                                temp_path = temp_image_file.name

                            log(f"    Saved to temp: {temp_path}")

                            try:
                                # Convertir en JPEG
                                image = Image.open(temp_path)
                                jpeg_path = temp_path.replace('.tmp', '.jpg')

                                if image.mode in ('RGBA', 'LA', 'P'):
                                    background = Image.new('RGB', image.size, (255, 255, 255))
                                    if image.mode == 'P':
                                        image = image.convert('RGBA')
                                    background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                                    image = background
                                elif image.mode != 'RGB':
                                    image = image.convert('RGB')

                                image.save(jpeg_path, 'JPEG', quality=85)
                                log(f"    Converted to JPEG: {jpeg_path}")

                                # Ajouter au PDF
                                pdf.add_page()
                                pdf.image(jpeg_path, 10, 10, 190, 277)
                                total_images_added += 1
                                log(f"    Added to PDF (total: {total_images_added})")

                                # Nettoyer
                                image.close()
                                os.unlink(temp_path)
                                os.unlink(jpeg_path)

                            except Exception as convert_err:
                                log(f"    ERROR converting image: {convert_err}")
                                if os.path.exists(temp_path):
                                    os.unlink(temp_path)
                                continue

                        else:
                            log(f"    Failed to download, status: {image_response.status_code}")

                    except Exception as img_err:
                        log(f"    ERROR downloading image: {img_err}")
                        log(f"    Traceback: {traceback.format_exc()}")
                        continue

            else:
                log(f"Failed to load page, status: {response.status_code}")

        except Exception as page_err:
            log(f"ERROR loading page {url}: {page_err}")
            log(f"Traceback: {traceback.format_exc()}")
            continue

    log(f"Total images added to PDF: {total_images_added}")

    if total_images_added == 0:
        log("ERROR: No images were added to the PDF")
        raise Exception("No images could be downloaded and added to PDF")

    log(f"Saving PDF to {output_path}...")
    try:
        pdf.output(output_path)
        log(f"PDF saved successfully")

        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            log(f"PDF file size: {file_size} bytes")
            if file_size == 0:
                raise Exception("PDF file is empty")
        else:
            raise Exception("PDF file was not created")

    except Exception as save_err:
        log(f"ERROR saving PDF: {save_err}")
        raise

if __name__ == "__main__":
    log(f"Script started: {sys.argv[0]}")
    log(f"Python version: {sys.version}")
    log(f"Arguments: {sys.argv}")

    if len(sys.argv) != 3:
        log("ERROR: Invalid number of arguments")
        print("Usage: dl_pdf.py '[\"url1\", \"url2\"]' output_path", file=sys.stderr)
        sys.exit(1)

    try:
        urls = json.loads(sys.argv[1])
        output_path = sys.argv[2]

        log(f"Parsed URLs: {urls}")
        log(f"Output PDF path: {output_path}")
        log(f"Number of URLs: {len(urls)}")

        download_images_from_urls(urls, output_path)

        log("Script completed successfully")
        sys.exit(0)

    except Exception as e:
        log(f"FATAL ERROR: {e}")
        log(f"Full traceback: {traceback.format_exc()}")
        print(f"FATAL ERROR: {e}", file=sys.stderr)
        sys.exit(1)
