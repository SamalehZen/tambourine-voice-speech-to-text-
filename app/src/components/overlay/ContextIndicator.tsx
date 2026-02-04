import { Badge, Tooltip } from "@mantine/core";
import {
	Code,
	FileText,
	Mail,
	MailOpen,
	MessageCircle,
	StickyNote,
	Terminal,
	Type,
} from "lucide-react";
import type { FormattingProfile } from "../../lib/formattingProfiles";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
	Type,
	Mail,
	MailOpen,
	MessageCircle,
	Code,
	Terminal,
	FileText,
	StickyNote,
};

const profileColorMap: Record<string, string> = {
	default: "gray",
	"email-pro": "blue",
	"email-casual": "cyan",
	chat: "green",
	code: "purple",
	terminal: "orange",
	document: "indigo",
	notes: "yellow",
};

interface ContextIndicatorProps {
	profile: FormattingProfile | null;
	appName?: string;
	compact?: boolean;
}

export function ContextIndicator({
	profile,
	appName,
	compact = false,
}: ContextIndicatorProps) {
	if (!profile) return null;

	const IconComponent = iconMap[profile.icon] ?? Type;
	const color = profileColorMap[profile.id] ?? "gray";

	const tooltipContent = appName
		? `${appName} → ${profile.name}`
		: profile.name;

	if (compact) {
		return (
			<Tooltip label={tooltipContent} position="bottom" withArrow>
				<Badge
					size="xs"
					variant="light"
					color={color}
					leftSection={<IconComponent size={10} />}
					style={{ cursor: "pointer" }}
				>
					{profile.name.slice(0, 8)}
				</Badge>
			</Tooltip>
		);
	}

	return (
		<Tooltip label={profile.description} position="bottom" withArrow>
			<Badge
				size="sm"
				variant="light"
				color={color}
				leftSection={<IconComponent size={12} />}
				style={{ cursor: "pointer" }}
			>
				{profile.name}
			</Badge>
		</Tooltip>
	);
}
