import { Badge, Card, Group, ScrollArea, Text } from "@mantine/core";
import {
	Code,
	FileText,
	Mail,
	MessageCircle,
	StickyNote,
	Terminal,
} from "lucide-react";
import {
	APP_PROFILE_MAPPINGS,
	DEFAULT_PROFILES,
	URL_PROFILE_MAPPINGS,
} from "../../lib/formattingProfiles";

const profileIconMap: Record<string, React.ReactNode> = {
	"email-pro": <Mail size={14} />,
	"email-casual": <Mail size={14} />,
	chat: <MessageCircle size={14} />,
	code: <Code size={14} />,
	terminal: <Terminal size={14} />,
	document: <FileText size={14} />,
	notes: <StickyNote size={14} />,
};

function MappingCard({
	profileId,
	apps,
}: {
	profileId: string;
	apps: string[];
}) {
	const profile = DEFAULT_PROFILES.find((p) => p.id === profileId);
	const icon = profileIconMap[profileId];

	if (!profile) return null;

	return (
		<Card
			padding="sm"
			radius="md"
			style={{
				backgroundColor: "var(--bg-elevated)",
				border: "1px solid var(--border-default)",
			}}
		>
			<Group gap="xs" mb="xs">
				{icon}
				<Text fw={500} size="sm" c="var(--text-primary)">
					{profile.name}
				</Text>
			</Group>
			<Group gap={4} wrap="wrap">
				{apps.slice(0, 6).map((app) => (
					<Badge
						key={app}
						size="xs"
						variant="light"
						color="gray"
						style={{ textTransform: "none" }}
					>
						{app.length > 20 ? `${app.slice(0, 20)}...` : app}
					</Badge>
				))}
				{apps.length > 6 && (
					<Badge size="xs" variant="outline" color="gray">
						+{apps.length - 6} more
					</Badge>
				)}
			</Group>
		</Card>
	);
}

export function AppMappings() {
	const urlMappingsByProfile = Object.entries(URL_PROFILE_MAPPINGS).reduce(
		(acc, [url, profileId]) => {
			if (!acc[profileId]) acc[profileId] = [];
			acc[profileId].push(url);
			return acc;
		},
		{} as Record<string, string[]>,
	);

	return (
		<div className="settings-section animate-in animate-in-delay-3">
			<h3 className="settings-section-title">Application Mappings</h3>
			<p className="settings-description" style={{ marginBottom: 16 }}>
				Applications are automatically mapped to formatting profiles based on
				their name, bundle ID, or URL. When you start recording, the active
				application is detected and the appropriate profile is applied.
			</p>

			<Text size="sm" fw={500} c="var(--text-primary)" mb="xs">
				App Mappings
			</Text>
			<ScrollArea.Autosize mah={300} mb="md">
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
						gap: 12,
					}}
				>
					{Object.entries(APP_PROFILE_MAPPINGS).map(([profileId, apps]) => (
						<MappingCard key={profileId} profileId={profileId} apps={apps} />
					))}
				</div>
			</ScrollArea.Autosize>

			<Text size="sm" fw={500} c="var(--text-primary)" mb="xs">
				URL Mappings (for browsers)
			</Text>
			<ScrollArea.Autosize mah={200}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
						gap: 12,
					}}
				>
					{Object.entries(urlMappingsByProfile).map(([profileId, urls]) => (
						<MappingCard key={profileId} profileId={profileId} apps={urls} />
					))}
				</div>
			</ScrollArea.Autosize>
		</div>
	);
}
