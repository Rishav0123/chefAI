from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.kitchen import KitchenStock, User
from app.models.kitchen import KitchenStock, User
from app.models.chat import ChatMessage
from app.models.meals import Meal
from app.services.inventory import InventoryManager
import os
import json
from openai import OpenAI
from youtubesearchpython import VideosSearch

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)

# --- Monkeypatch Start ---
# Fix for youtube-search-python passing 'proxies' to httpx.post
import httpx
import youtubesearchpython.core.requests

original_post = httpx.post
def patched_post(url, **kwargs):
    if 'proxies' in kwargs:
        kwargs.pop('proxies')
    return original_post(url, **kwargs)

youtubesearchpython.core.requests.httpx.post = patched_post
# --- Monkeypatch End ---

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    user_id: str

def get_stock_tool(user_id: str, db: Session):
    """Fetch the user's kitchen stock."""
    stocks = db.query(KitchenStock).filter(KitchenStock.user_id == user_id).all()
    if not stocks:
        return "Kitchen is empty."
    
    result = []
    for stock in stocks:
        item_str = f"- {stock.item_name}"
        if stock.quantity:
            item_str += f" ({stock.quantity})"
        if stock.expiry_date:
            item_str += f" [Expires: {stock.expiry_date}]"
        result.append(item_str)
    return "\n".join(result)

def log_meal_tool(user_id: str, meal_name: str, ingredients: list, db: Session, nutrition: dict = None, meal_type: str = "other", deduct_stock: bool = True):
    """Log a meal and optionally deduct stock."""
    manager = InventoryManager(db)
    
    # Unpack nutrition if provided
    calories = nutrition.get("calories") if nutrition else None
    protein_g = nutrition.get("protein") if nutrition else None
    carbs_g = nutrition.get("carbs") if nutrition else None
    fat_g = nutrition.get("fat") if nutrition else None

    # Determine source
    source = "manual" if deduct_stock else "dining_out"

    meal, report = manager.log_meal_and_deduct_stock(
        user_id, meal_name, ingredients, 
        calories=calories, protein_g=protein_g, carbs_g=carbs_g, fat_g=fat_g, meal_type=meal_type,
        deduct_stock=deduct_stock,
        source=source
    )
    
    msg_prefix = "Logged (Dining Out)" if not deduct_stock else "Logged (Cooked)"
    return f"{msg_prefix} '{meal_name}' ({calories}kcal, {protein_g}g protein). Updates:\n" + "\n".join(report)

def add_stock_tool(user_id: str, item_name: str, quantity_str: str, db: Session):
    """Add items to stock."""
    manager = InventoryManager(db)
    result = manager.add_stock(user_id, item_name, quantity_str)
    return result

def get_recent_meals_tool(user_id: str, days: int, db: Session):
    """Get the user's recent meals."""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.created_at >= cutoff_date
    ).order_by(Meal.created_at.desc()).all()
    
    if not meals:
        return f"No meals logged in the last {days} days."
    
    report = []
    for meal in meals:
        date_str = meal.created_at.strftime("%Y-%m-%d %H:%M")
        macros = f"({meal.calories}kcal, P:{meal.protein_g}g, C:{meal.carbs_g}g, F:{meal.fat_g}g)" if meal.calories else ""
        report.append(f"- {date_str}: {meal.name} {macros} [{meal.meal_type}]")
        
    return "\n".join(report)

def search_youtube_tool(query: str):
    """Search YouTube for videos."""
    try:
        videos_search = VideosSearch(query, limit=3)
        results = videos_search.result()
    except Exception as e:
        print(f"YouTube Search Error: {e}")
        return "Could not search for videos at this time."
    
    video_list = []
    for video in results['result']:
        title = video.get('title', 'Video')
        link = video.get('link', '#')
        thumbnails = video.get('thumbnails', [])
        thumbnail_url = thumbnails[0]['url'] if thumbnails else ""
        
        # Markdown for image linking to video
        if thumbnail_url:
            video_list.append(f"[![{title}]({thumbnail_url})]({link})\n**[{title}]({link})**")
        else:
            video_list.append(f"- **[{title}]({link})**")
    
    if not video_list:
        return "No videos found."
    
    return "\n\n".join(video_list)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_kitchen_stock",
            "description": "Get the list of available food items in the user's kitchen stock.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_youtube_videos",
            "description": "Search YouTube for recipe videos or cooking tutorials.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query for the video (e.g. 'tomato pasta recipe', 'how to cut onion').",
                    },
                },
                "required": ["query"],
            },
        },

    },
    {
        "type": "function",
        "function": {
            "name": "log_meal",
            "description": "Log a meal cooked by the user and deduct ingredients from stock. Use this when the user CONFIRMS they cooked something.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the meal (e.g. 'Tomato Pasta')."
                    },
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "item": {"type": "string", "description": "Ingredient name"},
                                "qty": {"type": "string", "description": "Quantity used (e.g. '3', '200g')"}
                            },
                            "required": ["item", "qty"]
                        },
                        "description": "List of ingredients used in the recipe."
                    }
                },
                "required": ["name", "ingredients"],
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the meal (e.g. 'Tomato Pasta')."
                    },
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "item": {"type": "string", "description": "Ingredient name"},
                                "qty": {"type": "string", "description": "Quantity used (e.g. '3', '200g')"}
                            },
                            "required": ["item", "qty"]
                        },
                        "description": "List of ingredients used in the recipe."
                    },
                    "nutrition": {
                        "type": "object",
                        "description": "Estimated nutrition for this meal.",
                        "properties": {
                            "calories": {"type": "integer", "description": "Estimated calories (kcal)"},
                            "protein": {"type": "integer", "description": "Estimated protein (g)"},
                            "carbs": {"type": "integer", "description": "Estimated carbs (g)"},
                            "fat": {"type": "integer", "description": "Estimated fat (g)"}
                        },
                        "required": ["calories", "protein"]
                    },
                    "meal_type": {
                        "type": "string",
                        "enum": ["breakfast", "lunch", "dinner", "snack"],
                        "description": "Type of meal based on context or user input."
                    },
                    "deduct_stock": {
                        "type": "boolean",
                        "description": "Whether detailed ingredients should be deducted from stock. Set to FALSE if the user ate outside or ordered food. Set to TRUE if cooked at home using stock."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_stock",
            "description": "Add an item to the kitchen stock. Use this when the user says they bought something or wants to add items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_name": {
                        "type": "string",
                        "description": "Name of the item (e.g. 'Rice', 'Milk')."
                    },
                    "quantity": {
                        "type": "string",
                        "description": "Quantity with unit (e.g. '2 kg', '1 liter', '5 pcs')."
                    },
                    "category": {
                        "type": "string",
                        "description": "Category of the item (e.g. 'vegetable', 'fruit', 'dairy', 'spice', 'grain')."
                    }
                },
                "required": ["item_name", "quantity"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_meals",
            "description": "Get the list of meals the user has logged recently. Use this when the user asks about their meal history or nutrition intake.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {
                        "type": "integer",
                        "description": "Number of past days to look back (default to 7 if not specified similar)."
                    }
                },
                "required": ["days"]
            }
        }
    }
]

from fastapi.responses import StreamingResponse
import json

# ... (Previous imports remain, ensure StreamingResponse is imported)

async def generate_chat_stream(request: ChatRequest, db: Session):
    try:
        # Ensure user exists (Same logic as before)
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            user = User(user_id=request.user_id, name="Guest User")
            db.add(user)
            db.commit()

        # 1. Fetch Chat History
        history = db.query(ChatMessage).filter(ChatMessage.user_id == request.user_id).order_by(ChatMessage.timestamp.desc()).limit(10).all()
        history.reverse()

        # 2. Construct Messages
        conversation_context = [
             {"role": "system", "content": "You are a helpful Kitchen Assistant. You help users decide what to cook based on their available stock. \n\nBEHAVIOR RULES:\n1. When asked for a recipe, ALWAYS provide the COMPLETE text recipe first. Include a full list of Ingredients and detailed step-by-step Instructions.\n2. **RECIPE CALL-TO-ACTION**: After providing ANY recipe, you MUST explicitly suggest logging it. End your response with a clear instruction like: **\"Type 'I made {Recipe Name}' to save this meal and update your stock!\"**\n3. Do NOT search for a video unless the user explicitly asks for one (e.g., 'show me a video', 'with video').\n4. If the user did NOT ask for a video, end your response with this EXACT suggested action format: `<<VIDEO_SUGGESTION: Show me a video for {Recipe Name}>>`\n5. If the user DOES ask for a video, call the `search_youtube_videos` tool and display the results including thumbnails.\n6. Need Video? Never say 'I will find a video' without actually calling the tool.\n\n7. MEAL LOGGING & TRACKING:\n   - **MULTI-MEAL LOGGING**: If the user lists multiple meals (e.g. 'Overview: Breakfast eggs, Lunch pasta'), you MUST call `log_meal` multiple times — once for each distinct meal.\n   - **CONTEXT AWARENESS**: If the user confirms a meal (e.g., 'I made it', 'I cooked the pasta'), use the ingredients from the *previously suggested recipe* in the conversation history to populate `log_meal`. Do not ask for ingredients again if they are already in the chat context.\n   - **AMBIGUITY**: If the user says they ate something but didn't say who made it, **YOU MUST ASK**: 'Did you cook this at home using your kitchen stock, or did you eat out?'\n   - **EATING OUT**: If the user says they 'ate out', 'ordered in', 'bought it', or 'restaurant', call `log_meal` with `deduct_stock=False`. Estimate nutrition but do NOT deduct ingredients.\n   - **HOME COOKED**: If the user says they 'cooked it', 'made it', or 'used my ingredients', call `log_meal` with `deduct_stock=True`.\n   - **CRITICAL**: For ALL meals (home or out), you MUST estimate nutrition (calories, protein, carbs, fat) and `meal_type`.\n   - **FEEDBACK**: The `log_meal` tool will start a **Action**, redirecting the user to a confirmation page. Inform the user: \"I've pre-filled the log for you. You can review and save it on the next screen.\"\n\n8. ADDING STOCK:\n   - If the user says 'add 2kg rice', 'I bought milk', etc., use the `add_to_stock` tool.\n   - Confirm the addition to the user with the result returned by the tool.\n\n9. MEAL HISTORY:\n   - If the user asks 'what did I eat last week?' or 'show my nutrition stats', use `get_recent_meals`.\n   - Summarize the returned list for the user."},
        ]
        for msg in history:
            conversation_context.append({"role": msg.role, "content": msg.content})
        
        conversation_context.append({"role": "user", "content": request.message})

        # Save User Message immediately
        user_msg_db = ChatMessage(user_id=request.user_id, role="user", content=request.message)
        db.add(user_msg_db)
        db.commit()

        # Tool Choice Logic
        tool_choice = "auto"
        if "video" in request.message.lower() or "youtube" in request.message.lower():
            tool_choice = "required"

        # --- STREAM LOGIC ---
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=conversation_context,
            tools=TOOLS,
            tool_choice=tool_choice,
            stream=True
        )

        full_content = ""
        tool_calls_buffer = {} # {index: {id, name, args_str}}

        for chunk in stream:
            delta = chunk.choices[0].delta

            # 1. Handle Tool Calls (Accumulation)
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {"id": tc.id, "name": tc.function.name, "args": ""}
                    if tc.function.arguments:
                        tool_calls_buffer[idx]["args"] += tc.function.arguments

            # 2. Handle Text Content
            if delta.content:
                full_content += delta.content
                yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

        # --- PROCESS TOOLS IF ANY ---
        if tool_calls_buffer:
            # Yield status
            yield f"data: {json.dumps({'type': 'status', 'content': 'Checking kitchen assistant...'})}\n\n"
            
            # Need to append the "assistant" message with tool_calls to context
            # Reconstruct the tool_calls object for the context
            openai_tool_calls_obj = []
            for idx, tc_data in tool_calls_buffer.items():
                openai_tool_calls_obj.append({
                    "id": tc_data["id"],
                    "type": "function",
                    "function": {
                        "name": tc_data["name"],
                        "arguments": tc_data["args"]
                    }
                })
            
            conversation_context.append({
                "role": "assistant",
                "content": None,
                "tool_calls": openai_tool_calls_obj
            })

            # Execute Tools
            for idx, tc_data in tool_calls_buffer.items():
                function_name = tc_data["name"]
                args_str = tc_data["args"]
                tool_call_id = tc_data["id"]

                try:
                    args = json.loads(args_str)
                except:
                    args = {}
                
                function_response = "Error executing tool"
                
                # Execute specific tool logic
                if function_name == "get_kitchen_stock":
                     yield f"data: {json.dumps({'type': 'status', 'content': 'Checking pantry stock...'})}\n\n"
                     function_response = get_stock_tool(request.user_id, db)
                     
                elif function_name == "search_youtube_videos":
                     yield f"data: {json.dumps({'type': 'status', 'content': 'Searching YouTube...'})}\n\n"
                     function_response = search_youtube_tool(args.get("query"))

                elif function_name == "log_meal":
                     yield f"data: {json.dumps({'type': 'action', 'action': 'DRAFT_MEAL', 'payload': args})}\n\n"
                     function_response = "Draft created. Redirecting user to review..."
                
                elif function_name == "add_to_stock":
                     yield f"data: {json.dumps({'type': 'action', 'action': 'DRAFT_STOCK', 'payload': args})}\n\n"
                     function_response = "Draft created. Redirecting user to review..."

                elif function_name == "get_recent_meals":
                     yield f"data: {json.dumps({'type': 'status', 'content': 'Fetching meal history...'})}\n\n"
                     function_response = get_recent_meals_tool(request.user_id, args.get("days", 7), db)

                # Append tool result to context
                conversation_context.append({
                    "tool_call_id": tool_call_id,
                    "role": "tool",
                    "name": function_name,
                    "content": str(function_response)
                })

            # Stream the second response
            second_stream = client.chat.completions.create(
                model="gpt-4o",
                messages=conversation_context,
                stream=True
            )
            
            for chunk in second_stream:
                if chunk.choices[0].delta.content:
                    content_chunk = chunk.choices[0].delta.content
                    full_content += content_chunk
                    yield f"data: {json.dumps({'type': 'token', 'content': content_chunk})}\n\n"

        # --- FINALIZATION ---
        # Post-process for video suggestions (Legacy logic)
        final_content = full_content
        if "Would you like to see a YouTube video" in final_content and "<<VIDEO_SUGGESTION:" not in final_content:
             suffix = "\n\n<<VIDEO_SUGGESTION: Show me a video for this recipe>>"
             final_content += suffix
             yield f"data: {json.dumps({'type': 'token', 'content': suffix})}\n\n"

        # Save Assistant Message
        assistant_msg_db = ChatMessage(user_id=request.user_id, role="assistant", content=final_content)
        db.add(assistant_msg_db)
        db.commit()
        
        # Done
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        print(f"Stream Error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

@router.post("/")
async def chat_with_chef(request: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(generate_chat_stream(request, db), media_type="text/event-stream")
