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
    Sends image to OpenAI Vision API and returns extracted items with confidence.
    """
    base64_image = encode_image(image_bytes)
    
    prompt = """
    You are a kitchen assistant. Analyze this image (grocery bill, fridge photo, or ingredient shot).
    Identify all food/grocery items found.
    
    IMPORTANT: 
    - Be lenient. If the image is blurry, give your BEST GUESS. 
    - Do not fail. If you see *anything* consistent with food, list it.
    - Ignore prices, tax, and non-food items.

    Return a STRICT JSON object with this structure:
    {
        "items": [
            {"item_name": "Milk", "quantity": "1L", "category": "dairy"},
            {"item_name": "Unknown Veg", "quantity": "1", "category": "vegetable"}
        ],
        "confidence": 85  // Integer 0-100. How sure are you about these results?
    }
    
    If the image is completely unreadable (black screen, floor, etc), return:
    { "items": [], "confidence": 0 }

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
        data = json.loads(content)
        
        # Backward compatibility if AI returns just a list (rare but possible)
        if isinstance(data, list):
            return {"items": data, "confidence": 100}
            
        return data
        
    except Exception as e:
        print(f"Error in OpenAI Vision call: {e}")
        return {"items": [], "confidence": 0, "error": str(e)}

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
