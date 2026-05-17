"""
LLM Client — calls fal.ai's OpenRouter gateway using the OpenAI-compatible API.
"""

from __future__ import annotations

import httpx
import time
from typing import Optional

from server.config import settings


class LLMClient:
    """
    Async HTTP client for the fal.ai OpenRouter gateway.
    Uses the OpenAI chat completions API format.
    """

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=settings.FAL_BASE_URL,
                headers=settings.fal_headers,
                timeout=httpx.Timeout(30.0, connect=10.0),
            )
        return self._client

    async def chat(
        self,
        system_prompt: str,
        user_message: str,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> dict:
        """
        Send a chat completion request.

        Returns:
            {
                "content": str,       # The generated text
                "model": str,         # Model that was used
                "latency_ms": float,  # Round-trip time
                "usage": {...}        # Token usage if available
            }
        """
        model = model or settings.DEFAULT_MODEL

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        client = await self._get_client()

        start = time.perf_counter()
        try:
            response = await client.post("/chat/completions", json=payload)
            elapsed_ms = (time.perf_counter() - start) * 1000

            if response.status_code != 200:
                error_text = response.text
                # Try fallback model
                if model != settings.FALLBACK_MODEL:
                    return await self.chat(
                        system_prompt=system_prompt,
                        user_message=user_message,
                        model=settings.FALLBACK_MODEL,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                raise LLMError(f"LLM API error {response.status_code}: {error_text}")

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            return {
                "content": content.strip(),
                "model": data.get("model", model),
                "latency_ms": elapsed_ms,
                "usage": data.get("usage", {}),
            }

        except httpx.TimeoutException:
            elapsed_ms = (time.perf_counter() - start) * 1000
            # Try fallback on timeout
            if model != settings.FALLBACK_MODEL:
                return await self.chat(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    model=settings.FALLBACK_MODEL,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            raise LLMError(f"LLM request timed out after {elapsed_ms:.0f}ms")

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class LLMError(Exception):
    """Raised when the LLM call fails."""
    pass


# Singleton
llm_client = LLMClient()
