"""
Chat API route — proxies messages to Anthropic Claude.

Keeps the API key server-side; the frontend never touches it directly.
"""

import os
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Chat"])

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""

    message: str
    model_config = {"json_schema_extra": {"examples": [{"message": "Hello!"}]}}


class ChatResponse(BaseModel):
    """Response from Claude."""

    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to Claude and return the reply.

    Args:
        request: ChatRequest containing the user message.

    Returns:
        ChatResponse with Claude's reply.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system="You are a helpful assistant for the Codify Vibeathon 2026 project. Be concise and useful.",
        messages=[{"role": "user", "content": request.message}],
    )

    return ChatResponse(reply=response.content[0].text)
