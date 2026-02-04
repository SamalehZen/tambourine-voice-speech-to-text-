"""Dictation-specific context management wrapping LLMContextAggregatorPair.

This module provides a context manager that integrates pipecat's LLMContextAggregatorPair
with the dictation-specific requirements:
- Three-section prompt system (main/advanced/dictionary)
- Context reset before each recording (no conversation history)
- External turn control via UserStartedSpeakingFrame/UserStoppedSpeakingFrame
- App context awareness for formatting profiles
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from openai.types.chat import ChatCompletionSystemMessageParam
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMAssistantAggregatorParams,
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.turns.user_turn_strategies import ExternalUserTurnStrategies

from processors.llm import combine_prompt_sections
from processors.profiles import FormattingProfile
from utils.logger import logger

if TYPE_CHECKING:
    from pipecat.processors.aggregators.llm_response_universal import (
        LLMAssistantAggregator,
        LLMUserAggregator,
    )


@dataclass
class AppContext:
    """Context information about the active application."""

    app_name: str
    profile: FormattingProfile
    additional_context: str | None = None


class DictationContextManager:
    """Manages LLM context for dictation with custom prompt support.

    Wraps LLMContextAggregatorPair and provides:
    - Three-section prompt system (main/advanced/dictionary)
    - Context reset before each recording
    - Aggregator access for pipeline placement
    - App context awareness for formatting profiles

    The aggregator pair uses ExternalUserTurnStrategies, meaning turn boundaries
    are controlled externally via UserStartedSpeakingFrame/UserStoppedSpeakingFrame
    emitted by TranscriptionBufferProcessor.
    """

    def __init__(self, **kwargs: Any) -> None:
        """Initialize the dictation context manager."""
        self._main_custom: str | None = None
        self._advanced_enabled: bool = True
        self._advanced_custom: str | None = None
        self._dictionary_enabled: bool = True
        self._dictionary_custom: str | None = None

        self._app_context: AppContext | None = None

        self._context = LLMContext()

        self._aggregator_pair = LLMContextAggregatorPair(
            self._context,
            user_params=LLMUserAggregatorParams(
                user_turn_strategies=ExternalUserTurnStrategies(),
                user_turn_stop_timeout=10.0,
            ),
            assistant_params=LLMAssistantAggregatorParams(),
        )

    @property
    def system_prompt(self) -> str:
        """Get the combined system prompt from all sections with app context."""
        base_prompt = combine_prompt_sections(
            main_custom=self._main_custom,
            advanced_enabled=self._advanced_enabled,
            advanced_custom=self._advanced_custom,
            dictionary_enabled=self._dictionary_enabled,
            dictionary_custom=self._dictionary_custom,
        )

        if self._app_context:
            context_section = self._build_app_context_section()
            return f"{base_prompt}\n\n{context_section}"

        return base_prompt

    def _build_app_context_section(self) -> str:
        """Build the app context section for the system prompt."""
        if not self._app_context:
            return ""

        profile = self._app_context.profile
        settings = profile.settings

        context_parts = [
            "## Active Application Context",
            f"You are formatting text for: {self._app_context.app_name}",
            "",
            f"### Formatting Profile: {profile.name}",
            profile.prompt,
            "",
            "### Profile Settings:",
            f"- Tone: {settings.tone.value}",
            f"- Punctuation: {settings.punctuation.value}",
            f"- Capitalization: {settings.capitalization.value}",
            f"- Line breaks: {settings.line_breaks.value}",
            f"- Emojis: {'allowed' if settings.emoji_allowed else 'not allowed'}",
        ]

        if settings.code_formatting:
            context_parts.append("- Code formatting: enabled")
        if settings.signature_enabled:
            context_parts.append("- Email signatures: enabled")

        if self._app_context.additional_context:
            context_parts.append("")
            context_parts.append(self._app_context.additional_context)

        context_parts.append("")
        context_parts.append(
            "Apply these formatting rules to the transcribed text while following all other core rules."
        )

        return "\n".join(context_parts)

    def set_app_context(
        self,
        app_name: str,
        profile: FormattingProfile,
        additional_context: str | None = None,
    ) -> None:
        """Set application context for the next recording.

        Args:
            app_name: Name of the active application.
            profile: The formatting profile to apply.
            additional_context: Optional additional context or instructions.
        """
        self._app_context = AppContext(
            app_name=app_name,
            profile=profile,
            additional_context=additional_context,
        )
        logger.info(f"App context set: {app_name} -> {profile.name}")

    def clear_app_context(self) -> None:
        """Clear the current app context."""
        self._app_context = None
        logger.debug("App context cleared")

    def set_prompt_sections(
        self,
        main_custom: str | None = None,
        advanced_enabled: bool = True,
        advanced_custom: str | None = None,
        dictionary_enabled: bool = False,
        dictionary_custom: str | None = None,
    ) -> None:
        """Update the prompt sections.

        The main section is always enabled. For each section, provide a custom
        prompt to override the default, or None to use the default.

        Args:
            main_custom: Custom prompt for main section, or None for default.
            advanced_enabled: Whether the advanced section is enabled.
            advanced_custom: Custom prompt for advanced section, or None for default.
            dictionary_enabled: Whether the dictionary section is enabled.
            dictionary_custom: Custom prompt for dictionary section, or None for default.
        """
        self._main_custom = main_custom
        self._advanced_enabled = advanced_enabled
        self._advanced_custom = advanced_custom
        self._dictionary_enabled = dictionary_enabled
        self._dictionary_custom = dictionary_custom
        logger.info("Formatting prompt sections updated")

    def reset_context_for_new_recording(self) -> None:
        """Reset the context for a new recording session.

        Called by TranscriptionBufferProcessor when recording starts.
        Clears all previous messages and sets the system prompt.
        This ensures each dictation is independent with no conversation history.
        """
        self._context.set_messages(
            [ChatCompletionSystemMessageParam(role="system", content=self.system_prompt)]
        )
        logger.debug("Context reset for new recording")

    def user_aggregator(self) -> LLMUserAggregator:
        """Get the user aggregator for pipeline placement.

        The user aggregator collects transcriptions between UserStartedSpeakingFrame
        and UserStoppedSpeakingFrame, then emits LLMContextFrame to trigger LLM.
        """
        return self._aggregator_pair.user()

    def assistant_aggregator(self) -> LLMAssistantAggregator:
        """Get the assistant aggregator for pipeline placement.

        The assistant aggregator collects LLM responses and adds them to context.
        For dictation, we don't need response history, but this maintains
        compatibility with pipecat's expected pipeline structure.
        """
        return self._aggregator_pair.assistant()
