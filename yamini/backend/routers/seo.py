"""
SEO Router — Serves dynamic sitemap.xml and product SEO metadata.
The sitemap auto-updates whenever products are created/updated/deleted.
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from database import get_db
from services.seo_service import generate_sitemap_xml, generate_product_seo_meta
from models import Product

router = APIRouter(prefix="/api/seo", tags=["SEO"])


@router.get("/sitemap.xml", response_class=Response)
def get_sitemap(db: Session = Depends(get_db)):
    """
    Generate and serve a dynamic sitemap.xml that includes all active products.
    This is automatically up-to-date — no manual regeneration needed.
    Google/Bing crawlers hit this URL directly.
    """
    xml_content = generate_sitemap_xml(db)
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache 1 hour
            "X-Robots-Tag": "noindex",  # Sitemaps shouldn't be indexed themselves
        }
    )


@router.get("/product/{product_id}/meta")
def get_product_seo_meta(product_id: int, db: Session = Depends(get_db)):
    """
    Get SEO metadata for a specific product.
    Used by the frontend to set dynamic meta tags via react-helmet.
    Also useful for sharing links that need rich previews.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}
    
    return generate_product_seo_meta(product)


@router.get("/products/meta")
def get_all_products_seo(db: Session = Depends(get_db)):
    """
    Get SEO metadata for all active products.
    Useful for generating a products index page with proper meta.
    """
    products = db.query(Product).filter(
        Product.status == "Active"
    ).order_by(Product.id).all()
    
    return {
        "total": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": f"/products/{p.id}",
                "title": f"{p.name}{f' - {p.brand}' if p.brand else ''} | Yamini Infotech",
                "description": (p.description or f"{p.name} at Yamini Infotech")[:160],
            }
            for p in products
        ]
    }
