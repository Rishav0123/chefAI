# Stock Sharing & Workspaces Implementation Plan

## Core Philosophy
To optimize the architecture and avoid duplicate logic, we will treat **Personal Pantries** and **Shared Groups** identically in the backend. 
- A "Personal Pantry" is simply a **Kitchen** with only 1 member (you).
- A "Shared Group" is a **Kitchen** with multiple members.

This unifies all logic: `Adding`, `Deleting`, and `Consuming` stock works exactly the same way regardless of whether it's personal or shared.

---

## 1. Database Schema Changes

We need to introduce a layer above the Stock items.

### New API Models (SQLAlchemy)

**1. `Kitchen` Table**
Represents a workspace.
- `id`: UUID
- `name`: String ("Rishav's Pantry", "Flat 302", etc.)
- `owner_id`: UUID (User who created it)
- `invite_code`: String (Unique 6-char code for joining)

**2. `KitchenMember` Table**
Links Users to Kitchens.
- `kitchen_id`: UUID
- `user_id`: UUID
- `role`: String ("admin", "member")

**3. Update `KitchenStock` Table**
- Add `kitchen_id` (ForeignKey).
- *Migration*: Existing stock items linked to `user_id` will be moved to a new "Personal Kitchen" created for that user.

---

## 2. Migration Strategy (The "No Data Loss" Path)

When we deploy this feature, we must handle existing data:
1.  **On Backend Startup** (or via a migration script):
    - Check every User.
    - If they don't have a `Kitchen` where they are owner, create one called "My Pantry".
    - Move all their existing `KitchenStock` items to this new `kitchen_id`.

---

## 3. Backend API Updates

**New Endpoints:**
- `POST /kitchens/` - Create a new group.
- `POST /kitchens/join` - Join a group via code.
- `GET /kitchens/` - List all kitchens I belong to.
- `POST /kitchens/switch` - (Optional) Verify access.

**Modified Endpoints:**
- `GET /stock/{kitchen_id}` - Get stock for the *active* workspace (replaces `GET /stock/{user_id}`).
- `POST /stock/` - Now requires `kitchen_id` in the body.
- `DELETE /stock/{id}` - checks if user is a member of the stock's kitchen.

---

## 4. Frontend Architecture

**1. UserContext Updates**
- Store `kitchens`: List of groups the user belongs to.
- Store `activeKitchen`: The currently selected workspace ID.
- Function `switchKitchen(kitchenId)`: Updates state and triggers a stock refresh.

**2. UI Changes**
- **Header/Profile**: Add a dropdown to switch between "My Pantry" and "Flat Group".
- **Stock List**: Displays items from `activeKitchen`.
- **Add Item**: Auto-selects `activeKitchen`.

---

## 5. Consumption Logic (Meals)

When logging a meal (e.g., "Pasta"):
1.  User selects "Log Meal".
2.  App asks (or defaults to): "Deduct ingredients from `activeKitchen`?"
3.  Ingredients are removed from that specific kitchen's inventory.
4.  *Nutrition history remains attached to the User, regardless of where the food came from.*

---

## 6. Implementation Steps

1.  **Backend Models**: Define `Kitchen` and `KitchenMember`.
2.  **Migration Script**: Logic to convert current Users -> Personal Kitchens.
3.  **API Routes**: Implement create/join/list kitchens.
4.  **Frontend State**: Add "Kitchen Switcher" logic to Context.
5.  **UI Components**: Add the "Create Group" & "Join Group" modals.

**Ready to proceed?** I can start by creating the database models.
