"""
SEO Service — Auto-generates sitemap.xml with all product pages.
Called automatically when products are created/updated/deleted.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from models import Product
import xml.etree.ElementTree as ET
from xml.dom import minidom

SITE_URL = "https://yaminicopier.com"

# Static pages with priority weights
STATIC_PAGES = [
    {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
    {"loc": "/products", "priority": "0.9", "changefreq": "daily"},
    {"loc": "/services", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "/about", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/contact", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/track", "priority": "0.6", "changefreq": "monthly"},
    # Blog pages
    {"loc": "/blog", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "/blog/best-photocopier-machine-for-small-office-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/blog/kyocera-vs-canon-printer-comparison-2026", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/blog/printer-rental-vs-buying-which-is-better", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/blog/copier-amc-maintenance-guide-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/blog/how-to-reduce-printing-cost-office", "priority": "0.7", "changefreq": "monthly"},
    # Location landing pages
    {"loc": "/copier-service-tirunelveli", "priority": "0.9", "changefreq": "monthly"},
    {"loc": "/printer-service-tenkasi", "priority": "0.9", "changefreq": "monthly"},
    {"loc": "/copier-dealer-nagercoil", "priority": "0.9", "changefreq": "monthly"},
    {"loc": "/xerox-machine-thoothukudi", "priority": "0.8", "changefreq": "monthly"},
    # Keyword-intent SEO pages
    {"loc": "/kyocera-copier-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/canon-printer-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/ricoh-copier-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/printer-rental-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/copier-amc-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/photocopier-repair-tirunelveli", "priority": "0.8", "changefreq": "monthly"},
    # Long-tail micro-intent pages
    {"loc": "/office-printer-for-school-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/a3-copier-machine-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/color-photocopier-rental-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/printer-repair-near-me-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    # Case study pages
    {"loc": "/kyocera-installation-school-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/printer-rental-for-hospital-tirunelveli", "priority": "0.7", "changefreq": "monthly"},
]


def generate_sitemap_xml(db: Session) -> str:
    """Generate a complete sitemap.xml string including all active products."""
    
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1")
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Add static pages
    for page in STATIC_PAGES:
        url_elem = ET.SubElement(urlset, "url")
        ET.SubElement(url_elem, "loc").text = f"{SITE_URL}{page['loc']}"
        ET.SubElement(url_elem, "lastmod").text = today
        ET.SubElement(url_elem, "changefreq").text = page["changefreq"]
        ET.SubElement(url_elem, "priority").text = page["priority"]
    
    # Add all active products
    products = db.query(Product).filter(
        Product.status == "Active"
    ).order_by(Product.id).all()
    
    for product in products:
        url_elem = ET.SubElement(urlset, "url")
        ET.SubElement(url_elem, "loc").text = f"{SITE_URL}/products/{product.id}"
        
        # Use product created_at as lastmod if available
        if product.created_at:
            ET.SubElement(url_elem, "lastmod").text = product.created_at.strftime("%Y-%m-%d")
        else:
            ET.SubElement(url_elem, "lastmod").text = today
        
        ET.SubElement(url_elem, "changefreq").text = "weekly"
        ET.SubElement(url_elem, "priority").text = "0.8"
        
        # Add image if available
        if product.image_url:
            image_url = product.image_url
            if not image_url.startswith("http"):
                image_url = f"https://api.yaminicopier.com{image_url if image_url.startswith('/') else '/' + image_url}"
            
            image_elem = ET.SubElement(url_elem, "image:image")
            ET.SubElement(image_elem, "image:loc").text = image_url
            ET.SubElement(image_elem, "image:title").text = product.name or "Product"
            if product.description:
                ET.SubElement(image_elem, "image:caption").text = product.description[:200]
    
    # Pretty-print
    rough_string = ET.tostring(urlset, encoding="unicode", xml_declaration=False)
    dom = minidom.parseString(rough_string)
    xml_string = '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toprettyxml(indent="  ")
    # Remove extra blank lines from minidom
    lines = [line for line in xml_string.split('\n') if line.strip()]
    return '\n'.join(lines) + '\n'


def generate_product_seo_meta(product: Product) -> dict:
    """Generate SEO metadata for a single product (for API response)."""
    image_url = ""
    if product.image_url:
        image_url = product.image_url if product.image_url.startswith("http") else \
            f"https://api.yaminicopier.com{product.image_url if product.image_url.startswith('/') else '/' + product.image_url}"
    
    description = product.description or f"{product.name} available at Yamini Infotech, Tirunelveli"
    if len(description) > 160:
        description = description[:157] + "..."
    
    return {
        "title": f"{product.name}{f' - {product.brand}' if product.brand else ''} | Yamini Infotech",
        "description": description,
        "canonical_url": f"{SITE_URL}/products/{product.id}",
        "og_image": image_url,
        "keywords": f"{product.name}, {product.brand or ''}, {product.category or 'copier'}, buy {product.name} Tirunelveli",
        "structured_data": _build_product_jsonld(product, image_url),
    }


def _build_product_jsonld(product: Product, image_url: str) -> dict:
    """Build JSON-LD structured data for a product."""
    import json
    
    jsonld = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description or f"{product.name} - available at Yamini Infotech",
        "image": image_url or f"{SITE_URL}/assets/main_logo.png",
        "brand": {
            "@type": "Brand",
            "name": product.brand or "Yamini Infotech",
        },
        "sku": product.product_id or f"YI-{product.id}",
        "offers": {
            "@type": "Offer",
            "url": f"{SITE_URL}/products/{product.id}",
            "priceCurrency": "INR",
            "price": product.price or 0,
            "availability": "https://schema.org/InStock" if (product.stock_quantity or 0) > 0 else "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "Yamini Infotech",
            },
            "itemCondition": "https://schema.org/NewCondition",
        },
    }
    
    if product.model:
        jsonld["model"] = product.model
    if product.category:
        jsonld["category"] = product.category
    
    # Parse specifications
    if product.specifications:
        try:
            specs = json.loads(product.specifications) if isinstance(product.specifications, str) else product.specifications
            jsonld["additionalProperty"] = [
                {"@type": "PropertyValue", "name": k, "value": str(v)}
                for k, v in specs.items()
            ]
        except (json.JSONDecodeError, AttributeError):
            pass
    
    return jsonld
