import base64
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def encode_image(image_file):
    return base64.b64encode(image_file).decode('utf-8')

def extract_items_from_image(image_bytes, mime_type="image/jpeg"):
    """
    Sends image to OpenAI Vision API and returns list of extracted items.
    """
    base64_image = encode_image(image_bytes)
    
    prompt = """
    You are a kitchen assistant. Analyze this image (which could be a grocery bill, an online shopping cart screenshot, or a photo of ingredients).
    Extract all food/grocery items found.
    Ignore prices, tax, total amounts, and non-food items.
    Return a STRICT JSON array of objects with the following keys:
    - item_name: string (clean name, e.g. "Tomatoes")
    - quantity: string (e.g. "1kg", "2 packs", or "1" if unknown)
    - category: string (one of: vegetable, fruit, dairy, meat, spice, grain, snack, beverage, other)
    
    Example output:
    [
        {"item_name": "Milk", "quantity": "1L", "category": "dairy"},
        {"item_name": "Onions", "quantity": "2kg", "category": "vegetable"}
    ]
    RETURN ONLY JSON. NO MARKDOWN.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=1000,
        )
        
        content = response.choices[0].message.content
        # Clean potential markdown code blocks
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
        
    except Exception as e:
        print(f"Error in OpenAI Vision call: {e}")
        return []

def extract_meal_from_image(image_bytes, mime_type="image/jpeg"):
    """
    Analyzes a photo of a cooked meal to estimate name, ingredients, and nutrition.
    """
    base64_image = encode_image(image_bytes)
    
    prompt = """
    You are an expert nutritionist and chef. Analyze this image of a cooked meal.
    Identify the dish, estimate the ingredients used, and provide nutritional values per serving.
    
    Return a STRICT JSON object with the following structure:
    {
        "name": "Dish Name (e.g. Spaghetti Bolognese)",
        "ingredients": [
            {"item": "Pasta", "qty": "100g"},
            {"item": "Ground Beef", "qty": "50g"},
            {"item": "Tomato Sauce", "qty": "100ml"}
        ],
        "nutrition": {
            "calories": 500,
            "protein_g": 20,
            "carbs_g": 60,
            "fat_g": 15
        },
        "meal_type": "dinner" (options: breakfast, lunch, dinner, snack, other),
        "confidence": 90 (integer 0-100 representing your confidence)
    }
    
    Assume a standard serving size. Be realistic with nutrition estimates.
    RETURN ONLY JSON. NO MARKDOWN.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=1000,
        )
        
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"Error in OpenAI Vision Meal Analysis: {e}")
        return None
