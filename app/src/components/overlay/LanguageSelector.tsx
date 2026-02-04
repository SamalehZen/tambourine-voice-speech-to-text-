import { ActionIcon, Badge, SimpleGrid, Text, Tooltip } from "@mantine/core";
import { X } from "lucide-react";

export interface TranslationLanguage {
	code: string;
	name: string;
	flag: string;
	nativeName: string;
}

export const SUPPORTED_LANGUAGES: TranslationLanguage[] = [
	{ code: "en", name: "English", flag: "🇬🇧", nativeName: "English" },
	{ code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
	{ code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
	{ code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
	{ code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
	{ code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
	{ code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
	{ code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
	{ code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
	{ code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
	{ code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
	{ code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
];

interface LanguageSelectorProps {
	languages: TranslationLanguage[];
	onSelect: (lang: TranslationLanguage) => void;
	onCancel: () => void;
}

export function LanguageSelector({
	languages,
	onSelect,
	onCancel,
}: LanguageSelectorProps) {
	return (
		<div
			style={{
				padding: "8px",
				background: "var(--mantine-color-dark-7)",
				borderRadius: "8px",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "8px",
					paddingBottom: "8px",
					borderBottom: "1px solid var(--mantine-color-dark-5)",
				}}
			>
				<Text size="sm" fw={500} c="dimmed">
					🌍 Translate to...
				</Text>
				<Tooltip label="Cancel (Esc)" withArrow>
					<ActionIcon
						variant="subtle"
						color="gray"
						size="sm"
						onClick={onCancel}
					>
						<X size={14} />
					</ActionIcon>
				</Tooltip>
			</div>
			<SimpleGrid cols={4} spacing="xs" style={{ flex: 1, overflow: "auto" }}>
				{languages.map((lang) => (
					<Tooltip key={lang.code} label={lang.name} withArrow>
						<button
							type="button"
							onClick={() => onSelect(lang)}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								padding: "8px 4px",
								borderRadius: "6px",
								border: "none",
								background: "transparent",
								cursor: "pointer",
								transition: "background 0.15s ease",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background =
									"var(--mantine-color-dark-5)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "transparent";
							}}
						>
							<span style={{ fontSize: "24px", marginBottom: "4px" }}>
								{lang.flag}
							</span>
							<Text size="xs" c="dimmed" lineClamp={1}>
								{lang.nativeName}
							</Text>
						</button>
					</Tooltip>
				))}
			</SimpleGrid>
		</div>
	);
}

interface TranslationIndicatorProps {
	targetLang: TranslationLanguage;
	onClear?: () => void;
}

export function TranslationIndicator({
	targetLang,
	onClear,
}: TranslationIndicatorProps) {
	return (
		<Tooltip
			label={`Translating to ${targetLang.name}${onClear ? " (click to cancel)" : ""}`}
			withArrow
		>
			<Badge
				size="xs"
				variant="light"
				color="violet"
				style={{ cursor: onClear ? "pointer" : "default" }}
				onClick={onClear}
			>
				→ {targetLang.flag}
			</Badge>
		</Tooltip>
	);
}
