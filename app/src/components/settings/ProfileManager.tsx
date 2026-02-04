import { ActionIcon, Badge, Card, Group, ScrollArea, Text } from "@mantine/core";
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
import { useMemo } from "react";
import {
	DEFAULT_PROFILES,
	type FormattingProfile,
} from "../../lib/formattingProfiles";

const iconMap: Record<string, React.ReactNode> = {
	Type: <Type size={16} />,
	Mail: <Mail size={16} />,
	MailOpen: <MailOpen size={16} />,
	MessageCircle: <MessageCircle size={16} />,
	Code: <Code size={16} />,
	Terminal: <Terminal size={16} />,
	FileText: <FileText size={16} />,
	StickyNote: <StickyNote size={16} />,
};

function ProfileCard({ profile }: { profile: FormattingProfile }) {
	const icon = iconMap[profile.icon] ?? <Type size={16} />;

	const toneColor = useMemo(() => {
		switch (profile.settings.tone) {
			case "formal":
				return "blue";
			case "casual":
				return "green";
			case "technical":
				return "purple";
			default:
				return "gray";
		}
	}, [profile.settings.tone]);

	return (
		<Card
			padding="sm"
			radius="md"
			style={{
				backgroundColor: "var(--bg-elevated)",
				border: "1px solid var(--border-default)",
			}}
		>
			<Group justify="space-between" mb="xs">
				<Group gap="xs">
					<ActionIcon
						variant="light"
						size="sm"
						color="gray"
						style={{ cursor: "default" }}
					>
						{icon}
					</ActionIcon>
					<Text fw={500} size="sm" c="var(--text-primary)">
						{profile.name}
					</Text>
				</Group>
				<Group gap={4}>
					<Badge size="xs" variant="light" color={toneColor}>
						{profile.settings.tone}
					</Badge>
					{profile.isBuiltIn && (
						<Badge size="xs" variant="outline" color="gray">
							Built-in
						</Badge>
					)}
				</Group>
			</Group>
			<Text size="xs" c="var(--text-secondary)" lineClamp={2}>
				{profile.description}
			</Text>
		</Card>
	);
}

export function ProfileManager() {
	const profiles = DEFAULT_PROFILES;

	return (
		<div className="settings-section animate-in animate-in-delay-2">
			<h3 className="settings-section-title">Formatting Profiles</h3>
			<p className="settings-description" style={{ marginBottom: 16 }}>
				Profiles automatically format your dictation based on the active
				application. Each profile has specific rules for tone, punctuation, and
				styling.
			</p>
			<ScrollArea.Autosize mah={400}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
						gap: 12,
					}}
				>
					{profiles.map((profile) => (
						<ProfileCard key={profile.id} profile={profile} />
					))}
				</div>
			</ScrollArea.Autosize>
		</div>
	);
}
