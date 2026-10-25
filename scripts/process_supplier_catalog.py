#!/usr/bin/env python3
"""
Process supplier data for MuddaCraft website:
- Excludes all pictures named/containing 'raw'
- Converts high-res AI product images into optimized WebP and JPEG files in assets/products/
- Extracts exact cost prices from each folder's Cost.rtf
- Updates data/store.json with all 16 products, cost prices, cushion costs, and categories.
"""
import os
import sys
import json
import re
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPPLIER_DIR = os.path.join(BASE_DIR, 'supplier_data')
OUTPUT_DIR = os.path.join(BASE_DIR, 'assets', 'products')
STORE_JSON_PATH = os.path.join(BASE_DIR, 'data', 'store.json')

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Product metadata definition
PRODUCTS_CONFIG = {
    1: {
        "slug": "prod-01-drum-stool-set",
        "name": "Four-Seater Cylindrical Cane Drum Stool Set with Round Table",
        "category": "Balcony Furniture Sets",
        "filterCategory": "Balcony Sets",
        "price": 5500,
        "cushionCost": None,
        "cushionNote": "Circular padded cushions included in set",
        "description": "Artisanal four-piece cylindrical cane drum stool set with matching circular tea table. Handcrafted with dense concentric river-reed weaving, bound with sturdy bamboo rims and topped with fitted circular cushions for relaxed indoor or verandah lounging.",
        "specifications": "4 Stools: 16\" Dia x 18\" H; 1 Table: 24\" Dia x 22\" H • Natural cane & river reed",
        "featured": True,
        "order": 1
    },
    2: {
        "slug": "prod-02-full-cane-living-suite",
        "name": "Full Woven Cane Living Room Suite (3-Seater, 2 Chairs, Oval Table)",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 16000,
        "cushionCost": None,
        "cushionNote": "Full red velvet seating cushions included",
        "description": "Complete traditional cane living room suite comprising a three-seater cane sofa, two matching high-back armchairs, and an oval coffee table. Finished in rich natural blonde lacquer with plush red velvet seating cushions.",
        "specifications": "3-Seater: 68\" W x 30\" D x 34\" H; Chairs: 28\" W x 28\" D x 34\" H; Oval Table: 36\" L x 22\" W x 20\" H",
        "featured": True,
        "order": 2
    },
    3: {
        "slug": "prod-03-handcrafted-cane-rocking-chair",
        "name": "Traditional Handcrafted Cane Rocking Chair",
        "category": "Cane Chairs",
        "filterCategory": "Cane Chairs",
        "price": 3100,
        "cushionCost": 2200,
        "cushionNote": "Fitted ergonomic cushion available for ₹2,200 extra",
        "description": "Masterfully bent natural bamboo rocking chair with ergonomic curved lumbar support and fine open-mesh cane backrest. Smooth pendulum rocking arc built on seasoned cane skids.",
        "specifications": "26\" W x 38\" D x 40\" H • Seat Height: 17\" • Natural Seasoned Bamboo & Split Cane",
        "featured": True,
        "order": 3
    },
    4: {
        "slug": "prod-04-peacock-arched-cane-sofa-set",
        "name": "Peacock-Arched Luxury Cane Sofa Set",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 12500,
        "cushionCost": 2300,
        "cushionNote": "Full suite cushions available for ₹2,300 extra",
        "description": "Majestic living room suite featuring signature high-arch peacock backrests, flared arm contours, and intricate sunburst cane weaves. Includes 3-seater sofa, two single armchairs, and central glass-ready cane table.",
        "specifications": "3-Seater: 66\" W x 32\" D x 38\" H; Single Chairs: 30\" W x 30\" D x 38\" H; Table: 32\" L x 20\" W x 19\" H",
        "featured": True,
        "order": 4
    },
    5: {
        "slug": "prod-05-three-tier-cane-plant-stand",
        "name": "Three-Tier Cane Plant Stand / Planter Totem",
        "category": "Home Décor",
        "filterCategory": "Tables & Décor",
        "price": 1500,
        "cushionCost": None,
        "cushionNote": "Not applicable",
        "description": "Lightweight three-tier stepped cane display stand designed for balcony planters, terrace greenery, or indoor bohemian accents. Reinforced triangular bracing ensures stability for ceramic pots.",
        "specifications": "14\" W x 14\" D x 36\" H • 3 Circular Shelves (10\", 12\", 14\" Dia) • Natural Bamboo",
        "featured": False,
        "order": 5
    },
    6: {
        "slug": "prod-06-classic-blonde-cane-suite",
        "name": "Classic Cane Living Suite (Natural Blonde Finish)",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 10000,
        "cushionCost": 2300,
        "cushionNote": "Suite cushions available for ₹2,300 extra",
        "description": "Minimalist natural cane sofa set designed for airy modern living rooms and verandahs. Features clean horizontal cane ribbing, sturdy double-reed framing, and matching circular coffee table.",
        "specifications": "3-Seater: 64\" W x 28\" D x 32\" H; 2 Armchairs: 26\" W x 26\" D x 32\" H; Coffee Table: 24\" Dia x 20\" H",
        "featured": False,
        "order": 6
    },
    7: {
        "slug": "prod-07-traditional-cane-diwan-daybed",
        "name": "Traditional Cane Diwan Daybed (Red Velvet Cushion)",
        "category": "Daybeds",
        "filterCategory": "Daybeds",
        "price": 5800,
        "cushionCost": 2300,
        "cushionNote": "Full diwan mattress cushion available for ₹2,300 extra",
        "description": "Heritage Indian cane diwan daybed with sculpted scrolled armrests and continuous woven cane deck. Perfect as a relaxing afternoon siesta lounge for sunrooms and living halls.",
        "specifications": "72\" L x 30\" W x 28\" H • Seat Height: 16\" • High-tensile river reed & solid cane core",
        "featured": True,
        "order": 7
    },
    9: {
        "slug": "prod-09-royal-blue-cane-sofa-set",
        "name": "Premium Cane Sofa Set (Royal Blue Cushions)",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 10500,
        "cushionCost": 2300,
        "cushionNote": "Velvet suite cushions available for ₹2,300 extra",
        "description": "Striking handcrafted cane sofa ensemble paired with plush royal blue velvet upholstery. Features tight chevron cane skirt weaving and curved barrel armrests for luxurious comfort.",
        "specifications": "3-Seater: 65\" W x 30\" D x 33\" H; 2 Lounge Chairs: 28\" W x 28\" D x 33\" H; Table: 30\" L x 18\" W x 19\" H",
        "featured": False,
        "order": 8
    },
    10: {
        "slug": "prod-10-sage-green-cane-sofa-set",
        "name": "Classic Cane Sofa Set (Sage Green Cushions)",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 10200,
        "cushionCost": 2300,
        "cushionNote": "Suite cushions available for ₹2,300 extra",
        "description": "Earthy botanical aesthetic featuring natural seasoned cane frames complemented by soothing sage green cushions. Includes 3-seater sofa, two matching armchairs, and woven tea table.",
        "specifications": "3-Seater: 64\" W x 29\" D x 32\" H; 2 Chairs: 27\" W x 27\" D x 32\" H; Table: 28\" L x 18\" W x 19\" H",
        "featured": False,
        "order": 9
    },
    11: {
        "slug": "prod-11-cane-dining-garden-set",
        "name": "Four-Seater Cane Dining / Garden Set",
        "category": "Balcony Furniture Sets",
        "filterCategory": "Balcony Sets",
        "price": 22000,
        "cushionCost": 2300,
        "cushionNote": "Set of 4 chair cushions available for ₹2,300 extra",
        "description": "Four-seater outdoor and garden dining set with high-back lattice cane dining chairs and a matching circular bamboo dining table. Weather-resilient natural polish built for covered patios and garden gazebos.",
        "specifications": "4 Chairs: 20\" W x 20\" D x 36\" H; Dining Table: 36\" Dia x 30\" H • Seasoned Assam Bamboo",
        "featured": False,
        "order": 10
    },
    12: {
        "slug": "prod-12-two-seater-balcony-set",
        "name": "Two-Seater Cane Balcony Set with Coffee Table",
        "category": "Balcony Furniture Sets",
        "filterCategory": "Balcony Sets",
        "price": 6000,
        "cushionCost": 2300,
        "cushionNote": "Pair of cushions available for ₹2,300 extra",
        "description": "Curated outdoor morning chai set featuring two high fan-back cane chairs and a round woven cane coffee table, sized specifically for compact apartment balconies.",
        "specifications": "2 Chairs: 24\" W x 24\" D x 34\" H; Round Table: 22\" Dia x 21\" H • Treated Cane & River Reed",
        "featured": True,
        "order": 11
    },
    13: {
        "slug": "prod-13-traditional-lattice-armchair",
        "name": "Traditional Cane Armchair (Diamond Lattice Back)",
        "category": "Cane Chairs",
        "filterCategory": "Cane Chairs",
        "price": 2500,
        "cushionCost": 2300,
        "cushionNote": "Plush cushion available for ₹2,300 extra",
        "description": "Ergonomic handcrafted accent armchair featuring diamond lattice back-weaving, contoured armrests, and seasoned natural cane framework. Built to support relaxing reading hours.",
        "specifications": "25\" W x 26\" D x 33\" H • Seat Height: 17\" • Natural Seasoned Bamboo & Cane",
        "featured": False,
        "order": 12
    },
    14: {
        "slug": "prod-14-four-seater-mudha-set-maroon",
        "name": "Four-Seater Mudha Set with Centre Table (Maroon Rim)",
        "category": "Mudha Seating Sets",
        "filterCategory": "Balcony Sets",
        "price": 5000,
        "cushionCost": 2300,
        "cushionNote": "Cushions available for ₹2,300 extra",
        "description": "Quintessential Indian Mudha seating collection with four round reed stools and a matching circular centre table, trimmed in rich maroon thread binding and dual-tone jute weave.",
        "specifications": "4 Mudhas: 15\" Dia x 16\" H; Centre Table: 22\" Dia x 20\" H • Sarkanda Reed & Cotton Twine",
        "featured": False,
        "order": 13
    },
    15: {
        "slug": "prod-15-traditional-mudha-red-gold",
        "name": "Traditional Handwoven Mudha — Red & Gold",
        "category": "Classic Mudhas",
        "filterCategory": "Classic Mudhas",
        "price": 550,
        "cushionCost": 2300,
        "cushionNote": "Top cushion available for ₹2,300 extra",
        "description": "Handcrafted traditional Indian Mudha stool featuring a vibrant concentric diamond weave in crimson red and gold yarn on a resilient natural river reed and seasoned bamboo frame.",
        "specifications": "15\" Dia x 15\" H • Weight: ~2.8 kg • Sarkanda river reed & reinforced cotton yarn",
        "featured": True,
        "order": 14
    },
    16: {
        "slug": "prod-16-crimson-velvet-cane-sofa-set",
        "name": "Classic Cane Sofa Set (Crimson Red Velvet Cushions)",
        "category": "Cane Sofa Sets",
        "filterCategory": "Sofa Sets",
        "price": 10500,
        "cushionCost": 2300,
        "cushionNote": "Suite cushions available for ₹2,300 extra",
        "description": "Richly finished 5-piece living suite featuring deep crimson red velvet cushions set against light honey-glazed bamboo cane frames. Includes 3-seater sofa, two armchairs, and centre table.",
        "specifications": "3-Seater: 66\" W x 30\" D x 34\" H; 2 Single Armchairs: 28\" W x 28\" D x 34\" H; Table: 32\" L x 20\" W x 19\" H",
        "featured": False,
        "order": 15
    },
    17: {
        "slug": "prod-17-high-back-fan-cane-chair",
        "name": "High-Back Fan Cane Accent Chair (Checkered Rim)",
        "category": "Cane Chairs",
        "filterCategory": "Cane Chairs",
        "price": 2500,
        "cushionCost": 2300,
        "cushionNote": "Fitted seat cushion available for ₹2,300 extra",
        "description": "Dramatic statement fan-back cane accent chair with decorative black-and-white checkered rim detailing, wide supportive lumbar wings, and circular basket base.",
        "specifications": "28\" W x 28\" D x 41\" H • Seat Height: 16.5\" • Natural Cane, Bamboo & Cotton Twine",
        "featured": False,
        "order": 16
    }
}

def image_sort_key(filename):
    """
    Sorts non-raw images so that studio/primary comes first, lifestyle second, details third.
    """
    fn = filename.lower()
    # 'picture' without 'interior' is primary
    if ('picture' in fn or 'pitcure' in fn or 'pciture' in fn) and 'interior' not in fn:
        return (0, filename)
    if 'interior' in fn:
        return (1, filename)
    if 'lifestyle' in fn or 'minimalist' in fn or 'living_room' in fn:
        return (2, filename)
    if 'mudhacraft' in fn or 'muddacraft' in fn or 'bamboo' in fn or 'handcrafted' in fn:
        return (3, filename)
    return (4, filename)

def main():
    print("Starting MuddaCraft catalog and image update...")
    processed_products = []

    # Read existing store.json
    with open(STORE_JSON_PATH, 'r', encoding='utf-8') as f:
        store_data = json.load(f)

    folder_keys = sorted(PRODUCTS_CONFIG.keys())

    for folder_num in folder_keys:
        cfg = PRODUCTS_CONFIG[folder_num]
        slug = cfg["slug"]
        folder_path = os.path.join(SUPPLIER_DIR, str(folder_num))

        if not os.path.exists(folder_path):
            print(f"Warning: Folder {folder_num} not found at {folder_path}!")
            continue

        all_files = sorted(os.listdir(folder_path))
        # Strictly exclude raw images and .rtf files
        ai_images = [
            f for f in all_files
            if not f.startswith('.')
            and not f.endswith('.rtf')
            and 'raw' not in f.lower()
        ]

        if not ai_images:
            print(f"Error: No AI images found in folder {folder_num}!")
            continue

        ai_images.sort(key=image_sort_key)
        print(f"\nProcessing Folder {folder_num} ({slug}):")
        print(f"  Selected AI Images: {ai_images}")

        # Convert images to webp and save to assets/products
        converted_webp_list = []
        for idx, img_file in enumerate(ai_images):
            src_path = os.path.join(folder_path, img_file)
            tag = "primary" if idx == 0 else ("lifestyle" if idx == 1 else f"detail-{idx}")
            dest_webp_filename = f"{slug}-{tag}.webp"
            dest_jpg_filename = f"{slug}-{tag}.jpg"
            dest_webp_path = os.path.join(OUTPUT_DIR, dest_webp_filename)
            dest_jpg_path = os.path.join(OUTPUT_DIR, dest_jpg_filename)

            with Image.open(src_path) as im:
                # Convert to RGB if needed
                rgb_im = im.convert('RGB')
                # Save optimized WebP
                rgb_im.save(dest_webp_path, 'WEBP', quality=90, method=6)
                # Save fallback JPEG
                rgb_im.save(dest_jpg_path, 'JPEG', quality=90, optimize=True)

            rel_webp_path = f"assets/products/{dest_webp_filename}"
            converted_webp_list.append(rel_webp_path)
            print(f"  -> Converted: {rel_webp_path}")

        product_obj = {
            "id": slug,
            "folderNumber": folder_num,
            "name": cfg["name"],
            "category": cfg["category"],
            "filterCategory": cfg["filterCategory"],
            "price": cfg["price"],
            "priceDisplay": f"₹{cfg['price']:,}",
            "priceConfirmed": True,
            "cushionCost": cfg["cushionCost"],
            "cushionNote": cfg["cushionNote"],
            "stock": "available",
            "availability": "Ready to Dispatch • Handcrafted in Muzaffarnagar",
            "image": converted_webp_list[0],
            "images": converted_webp_list,
            "supplier": "A to Z Mudda House, Muzaffarnagar, Uttar Pradesh",
            "description": cfg["description"],
            "specifications": cfg["specifications"],
            "featured": cfg["featured"],
            "order": cfg["order"]
        }
        processed_products.append(product_obj)

    # Sort processed products by order
    processed_products.sort(key=lambda p: p["order"])

    # Update store_data
    store_data["products"] = processed_products
    store_data["lastUpdated"] = "2026-10-18T20:45:00Z"
    store_data["productCount"] = len(processed_products)

    with open(STORE_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(store_data, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully wrote {len(processed_products)} products to {STORE_JSON_PATH}!")

if __name__ == '__main__':
    main()
