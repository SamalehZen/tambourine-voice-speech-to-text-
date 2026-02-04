"""Formatting profiles for context-aware dictation.

This module provides pre-defined formatting profiles that adapt LLM output
based on the active application context (e.g., email, chat, code editor).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Tone(str, Enum):
    """Tone settings for text formatting."""

    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    NEUTRAL = "neutral"


class Punctuation(str, Enum):
    """Punctuation level settings."""

    FULL = "full"
    MINIMAL = "minimal"
    NONE = "none"


class Capitalization(str, Enum):
    """Capitalization style settings."""

    SENTENCES = "sentences"
    TITLE = "title"
    LOWERCASE = "lowercase"
    PRESERVE = "preserve"


class LineBreaks(str, Enum):
    """Line break handling settings."""

    PARAGRAPHS = "paragraphs"
    SINGLE = "single"
    NONE = "none"


@dataclass
class ProfileSettings:
    """Settings that control text formatting behavior."""

    tone: Tone
    punctuation: Punctuation
    capitalization: Capitalization
    line_breaks: LineBreaks
    emoji_allowed: bool
    code_formatting: bool = False
    signature_enabled: bool = False


@dataclass
class FormattingProfile:
    """A complete formatting profile with prompt and settings."""

    id: str
    name: str
    description: str
    prompt: str
    settings: ProfileSettings


DEFAULT_PROFILES: dict[str, FormattingProfile] = {
    "default": FormattingProfile(
        id="default",
        name="Default",
        description="Standard dictation formatting",
        prompt="""Format the transcribed speech as clean, readable text.
- Use proper capitalization and punctuation
- Fix obvious speech recognition errors
- Maintain the natural flow of speech""",
        settings=ProfileSettings(
            tone=Tone.NEUTRAL,
            punctuation=Punctuation.FULL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.PARAGRAPHS,
            emoji_allowed=False,
        ),
    ),
    "email-pro": FormattingProfile(
        id="email-pro",
        name="Email Professional",
        description="Formal business emails",
        prompt="""Format as a professional email. Include:
- Appropriate greeting (Dear/Hello based on context)
- Clear, formal tone with complete sentences
- Professional sign-off if closing detected
- Proper paragraph breaks between topics

If the user says "sign off" or indicates ending, add:
Best regards,
[Name]""",
        settings=ProfileSettings(
            tone=Tone.FORMAL,
            punctuation=Punctuation.FULL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.PARAGRAPHS,
            emoji_allowed=False,
            signature_enabled=True,
        ),
    ),
    "email-casual": FormattingProfile(
        id="email-casual",
        name="Email Casual",
        description="Friendly, relaxed email formatting",
        prompt="""Format as a casual, friendly email:
- Relaxed greeting (Hey, Hi)
- Conversational tone
- Contractions are fine
- Brief paragraphs
- Friendly sign-off (Thanks!, Cheers, Best)""",
        settings=ProfileSettings(
            tone=Tone.CASUAL,
            punctuation=Punctuation.FULL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.PARAGRAPHS,
            emoji_allowed=True,
        ),
    ),
    "chat": FormattingProfile(
        id="chat",
        name="Chat & Messaging",
        description="Casual messaging for Slack, Discord, etc.",
        prompt="""Format for casual chat messaging:
- Keep it brief and conversational
- Use contractions naturally
- Emojis allowed when tone suggests them
- No formal punctuation needed at end of messages
- Multiple short messages can stay separate
- "new line" or "enter" starts a new message""",
        settings=ProfileSettings(
            tone=Tone.CASUAL,
            punctuation=Punctuation.MINIMAL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.SINGLE,
            emoji_allowed=True,
        ),
    ),
    "code": FormattingProfile(
        id="code",
        name="Code Editor",
        description="Programming-aware formatting",
        prompt="""Format for code/programming context:
- Detect variable names and use camelCase or snake_case as appropriate
- Technical terms should not be altered
- No periods at end of comments
- Preserve programming keywords exactly
- Format function names, class names properly
- Handle spoken symbols:
  - "equals" → =
  - "double equals" → ==
  - "triple equals" → ===
  - "arrow" or "fat arrow" → =>
  - "curly brace" → {
  - "close curly" → }
  - "square bracket" → [
  - "semicolon" → ;
  - "colon" → :
- "new line" starts a new line of code""",
        settings=ProfileSettings(
            tone=Tone.TECHNICAL,
            punctuation=Punctuation.MINIMAL,
            capitalization=Capitalization.PRESERVE,
            line_breaks=LineBreaks.NONE,
            emoji_allowed=False,
            code_formatting=True,
        ),
    ),
    "terminal": FormattingProfile(
        id="terminal",
        name="Terminal/CLI",
        description="Command-line formatting",
        prompt="""Format for terminal/command-line:
- All lowercase unless explicitly capitalized
- No punctuation
- Preserve exact command syntax
- Handle flags:
  - "dash dash verbose" → --verbose
  - "dash v" → -v
  - "dash f" → -f
- Handle symbols:
  - "pipe" → |
  - "redirect" or "greater than" → >
  - "append" → >>
  - "ampersand" or "and" → &&
  - "tilde" → ~
  - "slash" → /
  - "backslash" → \\""",
        settings=ProfileSettings(
            tone=Tone.TECHNICAL,
            punctuation=Punctuation.NONE,
            capitalization=Capitalization.LOWERCASE,
            line_breaks=LineBreaks.NONE,
            emoji_allowed=False,
        ),
    ),
    "document": FormattingProfile(
        id="document",
        name="Document",
        description="Full document formatting",
        prompt="""Format for document writing:
- Full sentences with proper grammar
- Complete punctuation
- Organize into clear paragraphs
- Use formal, clear language
- Handle dictated formatting:
  - "new paragraph" → start new paragraph
  - "bullet point" → create bullet point
  - "heading" → format as heading""",
        settings=ProfileSettings(
            tone=Tone.FORMAL,
            punctuation=Punctuation.FULL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.PARAGRAPHS,
            emoji_allowed=False,
        ),
    ),
    "notes": FormattingProfile(
        id="notes",
        name="Notes",
        description="Quick note-taking format",
        prompt="""Format for quick note-taking:
- Brief, scannable format
- Bullet points for lists
- Key information highlighted
- "bullet" or "dash" creates a bullet point
- "heading" or "title" creates a section header
- Skip unnecessary words""",
        settings=ProfileSettings(
            tone=Tone.NEUTRAL,
            punctuation=Punctuation.MINIMAL,
            capitalization=Capitalization.SENTENCES,
            line_breaks=LineBreaks.SINGLE,
            emoji_allowed=False,
        ),
    ),
}

APP_BUNDLE_MAPPINGS: dict[str, list[str]] = {
    "email-pro": [
        "com.google.Chrome",
        "com.apple.mail",
        "com.microsoft.Outlook",
        "com.readdle.smartemail",
    ],
    "chat": [
        "com.tinyspeck.slackmacgap",
        "com.hnc.Discord",
        "WhatsApp",
        "com.facebook.Messenger",
        "Telegram",
    ],
    "code": [
        "com.microsoft.VSCode",
        "com.jetbrains.intellij",
        "com.todesktop.230313mzl4w4u92",
        "com.sublimetext.4",
    ],
    "terminal": [
        "com.apple.Terminal",
        "com.googlecode.iterm2",
        "dev.warp.Warp-Stable",
        "org.alacritty",
    ],
    "document": [
        "com.microsoft.Word",
        "com.apple.iWork.Pages",
    ],
    "notes": [
        "com.apple.Notes",
        "md.obsidian",
        "notion.id",
    ],
}

URL_PATTERNS: dict[str, str] = {
    "mail.google.com": "email-pro",
    "outlook.office.com": "email-pro",
    "outlook.live.com": "email-pro",
    "slack.com": "chat",
    "discord.com": "chat",
    "web.whatsapp.com": "chat",
    "messenger.com": "chat",
    "web.telegram.org": "chat",
    "github.com": "code",
    "gitlab.com": "code",
    "docs.google.com": "document",
    "notion.so": "notes",
}


def get_profile_for_app(
    app_name: str,
    bundle_id: str | None = None,
    url: str | None = None,
) -> FormattingProfile:
    """Determine the best formatting profile for given app context.

    Args:
        app_name: Name of the active application.
        bundle_id: macOS bundle identifier (optional).
        url: Browser URL if applicable (optional).

    Returns:
        The most appropriate FormattingProfile for the context.
    """
    if url:
        for url_pattern, profile_id in URL_PATTERNS.items():
            if url_pattern in url:
                if profile_id in DEFAULT_PROFILES:
                    return DEFAULT_PROFILES[profile_id]

    if bundle_id:
        for profile_id, bundle_patterns in APP_BUNDLE_MAPPINGS.items():
            if bundle_id in bundle_patterns:
                if profile_id in DEFAULT_PROFILES:
                    return DEFAULT_PROFILES[profile_id]

    app_lower = app_name.lower()
    if any(x in app_lower for x in ["code", "studio", "intellij", "vim", "nvim", "cursor"]):
        return DEFAULT_PROFILES["code"]
    if any(x in app_lower for x in ["terminal", "iterm", "warp", "kitty", "alacritty"]):
        return DEFAULT_PROFILES["terminal"]
    if any(x in app_lower for x in ["slack", "discord", "telegram", "whatsapp", "messenger"]):
        return DEFAULT_PROFILES["chat"]
    if any(x in app_lower for x in ["mail", "outlook"]):
        return DEFAULT_PROFILES["email-pro"]
    if any(x in app_lower for x in ["word", "pages", "docs"]):
        return DEFAULT_PROFILES["document"]
    if any(x in app_lower for x in ["notes", "obsidian", "notion", "bear", "evernote"]):
        return DEFAULT_PROFILES["notes"]

    return DEFAULT_PROFILES["default"]


def get_profile_by_id(profile_id: str) -> FormattingProfile | None:
    """Get a profile by its ID.

    Args:
        profile_id: The profile identifier.

    Returns:
        The profile if found, None otherwise.
    """
    return DEFAULT_PROFILES.get(profile_id)
