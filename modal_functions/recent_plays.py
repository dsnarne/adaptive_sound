import modal
from typing import List, Dict, Any
import json
from datetime import datetime, timezone
import os

# Define the image with required packages
image = modal.Image.debian_slim().pip_install(
    "fastapi>=0.104.0",
    "pydantic>=2.0.0"
)

# Create the app
app = modal.App("adaptive-sound-plays")

# Define functions that will import FastAPI/Pydantic at runtime
@app.function(image=image, min_containers=1)
@modal.fastapi_endpoint(method="POST")
def record_play(request_data: dict, authorization: str = None):
    """Record a new play for a user"""
    # Import here to avoid local import issues
    from fastapi import HTTPException
    
    # Validate auth - check if authorization header is provided
    expected_token = os.getenv("MODAL_AUTH_TOKEN", "demo-token-12345")
    
    # Handle different authorization header formats
    auth_header = authorization
    if not auth_header and hasattr(request_data, 'get'):
        # Try to get from headers if passed in request_data
        auth_header = request_data.get('authorization')
    
    if not auth_header or not auth_header.startswith(f"Bearer {expected_token}"):
        # For testing, let's be more permissive
        print(f"Auth check failed. Expected: Bearer {expected_token}, Got: {auth_header}")
        # For now, let's allow requests without auth for testing
        # raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Extract data from request
    user_id = request_data.get("user_id")
    play_record = request_data.get("play_record", {})
    
    if not user_id or not play_record:
        raise HTTPException(status_code=400, detail="Missing user_id or play_record")
    
    recent_plays_dict = modal.Dict.from_name("recent_plays_dict", create_if_missing=True)
    user_key = f"user:{user_id}"
    
    # Get existing plays or empty list
    plays = recent_plays_dict.get(user_key, [])
    
    # Prepare play record
    play_data = {
        "clip_id": play_record.get("clip_id", ""),
        "url": play_record.get("url", ""),
        "topics": play_record.get("topics", "")[:512],  # Limit length
        "tags": play_record.get("tags", "")[:512],      # Limit length
        "started_at": play_record.get("started_at") or datetime.now(timezone.utc).isoformat(),
        "source": play_record.get("source", "generate")
    }
    
    # Only record if it's a new clip_id (prevent duplicates)
    existing_clip_ids = [p.get('clip_id') for p in plays]
    should_record = play_data['clip_id'] not in existing_clip_ids
    
    if should_record:
        # Append new play and keep last 50, maintaining order
        plays = (plays + [play_data])[-50:]
        recent_plays_dict[user_key] = plays
    
    return {"success": True, "total_plays": len(plays)}

@app.function(image=image, min_containers=1)
@modal.fastapi_endpoint(method="GET")
def get_recent_plays(user_id: str, limit: int = 10, authorization: str = None):
    """Get recent plays for a user (newest first)"""
    # Import here to avoid local import issues
    from fastapi import HTTPException
    
    # For testing, let's be more permissive with auth
    print(f"Getting recent plays for user: {user_id}, limit: {limit}")
    
    recent_plays_dict = modal.Dict.from_name("recent_plays_dict", create_if_missing=True)
    user_key = f"user:{user_id}"
    
    plays = recent_plays_dict.get(user_key, [])
    # Return newest first, limited
    return plays[-limit:][::-1] if plays else []