"""
Context Manager — manages session context for multi-turn conversations.
"""

from __future__ import annotations

from typing import Optional
from server.models import TranslationContext, FlightContext, Touchpoint
from server.config import settings


class SessionContext:
    """Tracks conversation context for a single agent session."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.touchpoint: Touchpoint = Touchpoint.GENERAL
        self.flight: Optional[FlightContext] = None
        self.history: list[dict] = []  # Last N turns
        self.max_turns: int = settings.MAX_CONTEXT_TURNS

    def add_turn(self, source_text: str, translation: str) -> None:
        """Record a translation turn for multi-turn context."""
        self.history.append({
            "source": source_text,
            "translation": translation,
        })
        # Keep only last N turns
        if len(self.history) > self.max_turns:
            self.history = self.history[-self.max_turns:]

    def get_history_text(self) -> str:
        """Format recent history for injection into conversation context."""
        if not self.history:
            return ""

        lines = ["RECENT CONVERSATION:"]
        for i, turn in enumerate(self.history[-5:], 1):  # Last 5 turns max
            lines.append(f"  Turn {i}: \"{turn['source']}\" → \"{turn['translation']}\"")
        return "\n".join(lines)

    def reset(self) -> None:
        """Reset session context (e.g., agent changes gate/flight)."""
        self.history = []
        self.flight = None
        self.touchpoint = Touchpoint.GENERAL


class ContextManager:
    """Manages multiple agent sessions."""

    def __init__(self):
        self._sessions: dict[str, SessionContext] = {}

    def get_or_create(self, session_id: str) -> SessionContext:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionContext(session_id)
        return self._sessions[session_id]

    def update_session(
        self,
        session_id: str,
        context: Optional[TranslationContext] = None,
    ) -> SessionContext:
        """Update a session with new context from a request."""
        session = self.get_or_create(session_id)

        if context:
            session.touchpoint = context.touchpoint
            if context.flight:
                session.flight = context.flight

        return session

    def close_session(self, session_id: str) -> None:
        """Close and clean up a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]

    @property
    def active_sessions(self) -> int:
        return len(self._sessions)


# Singleton
context_manager = ContextManager()
