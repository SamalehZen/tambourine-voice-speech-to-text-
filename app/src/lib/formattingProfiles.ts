import { z } from "zod";

export const ToneSchema = z.enum(["formal", "casual", "technical", "neutral"]);
export const PunctuationSchema = z.enum(["full", "minimal", "none"]);
export const CapitalizationSchema = z.enum([
	"sentences",
	"title",
	"lowercase",
	"preserve",
]);
export const LineBreaksSchema = z.enum(["paragraphs", "single", "none"]);

export type Tone = z.infer<typeof ToneSchema>;
export type Punctuation = z.infer<typeof PunctuationSchema>;
export type Capitalization = z.infer<typeof CapitalizationSchema>;
export type LineBreaks = z.infer<typeof LineBreaksSchema>;

export const ProfileSettingsSchema = z.object({
	tone: ToneSchema,
	punctuation: PunctuationSchema,
	capitalization: CapitalizationSchema,
	lineBreaks: LineBreaksSchema,
	emojiAllowed: z.boolean(),
	codeFormatting: z.boolean().optional(),
	signatureEnabled: z.boolean().optional(),
});

export type ProfileSettings = z.infer<typeof ProfileSettingsSchema>;

export const FormattingProfileSchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string(),
	description: z.string(),
	prompt: z.string(),
	settings: ProfileSettingsSchema,
	isBuiltIn: z.boolean().optional(),
});

export type FormattingProfile = z.infer<typeof FormattingProfileSchema>;

export const ActiveWindowInfoSchema = z.object({
	window_title: z.string(),
	app_name: z.string(),
	bundle_id: z.string().optional(),
	process_name: z.string().optional(),
	url: z.string().optional(),
});

export type ActiveWindowInfo = z.infer<typeof ActiveWindowInfoSchema>;

export const DEFAULT_PROFILES: FormattingProfile[] = [
	{
		id: "default",
		name: "Default",
		icon: "Type",
		description: "Standard dictation formatting",
		prompt: `Format the transcribed speech as clean, readable text.
- Use proper capitalization and punctuation
- Fix obvious speech recognition errors
- Maintain the natural flow of speech`,
		settings: {
			tone: "neutral",
			punctuation: "full",
			capitalization: "sentences",
			lineBreaks: "paragraphs",
			emojiAllowed: false,
		},
		isBuiltIn: true,
	},
	{
		id: "email-pro",
		name: "Email Professional",
		icon: "Mail",
		description: "Formal business emails with proper salutations",
		prompt: `Format as a professional email. Include:
- Appropriate greeting (Dear/Hello based on context)
- Clear, formal tone with complete sentences
- Professional sign-off if closing detected
- Proper paragraph breaks between topics

If the user says "sign off" or indicates ending, add:
Best regards,
[Name]`,
		settings: {
			tone: "formal",
			punctuation: "full",
			capitalization: "sentences",
			lineBreaks: "paragraphs",
			emojiAllowed: false,
			signatureEnabled: true,
		},
		isBuiltIn: true,
	},
	{
		id: "email-casual",
		name: "Email Casual",
		icon: "MailOpen",
		description: "Friendly, relaxed email formatting",
		prompt: `Format as a casual, friendly email:
- Relaxed greeting (Hey, Hi)
- Conversational tone
- Contractions are fine
- Brief paragraphs
- Friendly sign-off (Thanks!, Cheers, Best)`,
		settings: {
			tone: "casual",
			punctuation: "full",
			capitalization: "sentences",
			lineBreaks: "paragraphs",
			emojiAllowed: true,
		},
		isBuiltIn: true,
	},
	{
		id: "chat",
		name: "Chat & Messaging",
		icon: "MessageCircle",
		description: "Casual messaging for Slack, Discord, etc.",
		prompt: `Format for casual chat messaging:
- Keep it brief and conversational
- Use contractions naturally
- Emojis allowed when tone suggests them
- No formal punctuation needed at end of messages
- Multiple short messages can stay separate
- "new line" or "enter" starts a new message`,
		settings: {
			tone: "casual",
			punctuation: "minimal",
			capitalization: "sentences",
			lineBreaks: "single",
			emojiAllowed: true,
		},
		isBuiltIn: true,
	},
	{
		id: "code",
		name: "Code Editor",
		icon: "Code",
		description: "Programming-aware formatting",
		prompt: `Format for code/programming context:
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
- "new line" starts a new line of code`,
		settings: {
			tone: "technical",
			punctuation: "minimal",
			capitalization: "preserve",
			lineBreaks: "none",
			emojiAllowed: false,
			codeFormatting: true,
		},
		isBuiltIn: true,
	},
	{
		id: "terminal",
		name: "Terminal/CLI",
		icon: "Terminal",
		description: "Command-line formatting",
		prompt: `Format for terminal/command-line:
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
  - "backslash" → \\`,
		settings: {
			tone: "technical",
			punctuation: "none",
			capitalization: "lowercase",
			lineBreaks: "none",
			emojiAllowed: false,
		},
		isBuiltIn: true,
	},
	{
		id: "document",
		name: "Document",
		icon: "FileText",
		description: "Full document formatting",
		prompt: `Format for document writing:
- Full sentences with proper grammar
- Complete punctuation
- Organize into clear paragraphs
- Use formal, clear language
- Handle dictated formatting:
  - "new paragraph" → start new paragraph
  - "bullet point" → create bullet point
  - "heading" → format as heading`,
		settings: {
			tone: "formal",
			punctuation: "full",
			capitalization: "sentences",
			lineBreaks: "paragraphs",
			emojiAllowed: false,
		},
		isBuiltIn: true,
	},
	{
		id: "notes",
		name: "Notes",
		icon: "StickyNote",
		description: "Quick note-taking format",
		prompt: `Format for quick note-taking:
- Brief, scannable format
- Bullet points for lists
- Key information highlighted
- "bullet" or "dash" creates a bullet point
- "heading" or "title" creates a section header
- Skip unnecessary words`,
		settings: {
			tone: "neutral",
			punctuation: "minimal",
			capitalization: "sentences",
			lineBreaks: "single",
			emojiAllowed: false,
		},
		isBuiltIn: true,
	},
];

export const APP_PROFILE_MAPPINGS: Record<string, string[]> = {
	"email-pro": [
		"com.google.Chrome",
		"com.apple.mail",
		"com.microsoft.Outlook",
		"com.readdle.smartemail",
		"Mail",
		"Outlook",
		"Thunderbird",
	],
	chat: [
		"com.tinyspeck.slackmacgap",
		"com.hnc.Discord",
		"WhatsApp",
		"com.facebook.Messenger",
		"Telegram",
		"Slack",
		"Discord",
		"Signal",
		"Messages",
		"com.apple.MobileSMS",
	],
	code: [
		"com.microsoft.VSCode",
		"com.jetbrains.intellij",
		"com.todesktop.230313mzl4w4u92",
		"com.sublimetext.4",
		"Code",
		"Visual Studio Code",
		"Cursor",
		"IntelliJ IDEA",
		"WebStorm",
		"PyCharm",
		"Sublime Text",
		"Zed",
		"nvim",
		"vim",
		"Neovim",
	],
	terminal: [
		"com.apple.Terminal",
		"com.googlecode.iterm2",
		"dev.warp.Warp-Stable",
		"org.alacritty",
		"Terminal",
		"iTerm2",
		"Warp",
		"kitty",
		"Alacritty",
		"Hyper",
		"WindowsTerminal",
		"cmd.exe",
		"powershell.exe",
	],
	document: [
		"com.microsoft.Word",
		"com.apple.iWork.Pages",
		"Word",
		"Pages",
		"Google Docs",
		"LibreOffice Writer",
		"WINWORD.EXE",
	],
	notes: [
		"com.apple.Notes",
		"md.obsidian",
		"notion.id",
		"Notes",
		"Obsidian",
		"Notion",
		"Bear",
		"Evernote",
		"OneNote",
	],
};

export const URL_PROFILE_MAPPINGS: Record<string, string> = {
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
};

export function detectProfileForApp(
	windowInfo: ActiveWindowInfo,
): FormattingProfile | null {
	if (windowInfo.url) {
		for (const [urlPattern, profileId] of Object.entries(
			URL_PROFILE_MAPPINGS,
		)) {
			if (windowInfo.url.includes(urlPattern)) {
				const profile = DEFAULT_PROFILES.find((p) => p.id === profileId);
				if (profile) return profile;
			}
		}
	}

	const appIdentifiers = [
		windowInfo.bundle_id,
		windowInfo.app_name,
		windowInfo.process_name,
	].filter(Boolean) as string[];

	for (const [profileId, appPatterns] of Object.entries(APP_PROFILE_MAPPINGS)) {
		for (const identifier of appIdentifiers) {
			if (
				appPatterns.some(
					(pattern) =>
						identifier.includes(pattern) ||
						pattern.toLowerCase() === identifier.toLowerCase(),
				)
			) {
				const profile = DEFAULT_PROFILES.find((p) => p.id === profileId);
				if (profile) return profile;
			}
		}
	}

	const appLower = windowInfo.app_name.toLowerCase();
	if (
		appLower.includes("code") ||
		appLower.includes("studio") ||
		appLower.includes("intellij") ||
		appLower.includes("vim")
	) {
		return DEFAULT_PROFILES.find((p) => p.id === "code") ?? null;
	}
	if (
		appLower.includes("terminal") ||
		appLower.includes("iterm") ||
		appLower.includes("warp")
	) {
		return DEFAULT_PROFILES.find((p) => p.id === "terminal") ?? null;
	}
	if (
		appLower.includes("slack") ||
		appLower.includes("discord") ||
		appLower.includes("telegram")
	) {
		return DEFAULT_PROFILES.find((p) => p.id === "chat") ?? null;
	}

	return null;
}

export function getProfileById(
	profileId: string,
	customProfiles: FormattingProfile[] = [],
): FormattingProfile | null {
	const allProfiles = [...DEFAULT_PROFILES, ...customProfiles];
	return allProfiles.find((p) => p.id === profileId) ?? null;
}
