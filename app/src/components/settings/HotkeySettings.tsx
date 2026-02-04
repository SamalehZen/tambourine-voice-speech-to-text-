import { ActionIcon, Alert, Text, Tooltip } from "@mantine/core";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import {
	DEFAULT_HOLD_HOTKEY,
	DEFAULT_PASTE_LAST_HOTKEY,
	DEFAULT_TOGGLE_HOTKEY,
	DEFAULT_TRANSLATION_HOTKEY,
} from "../../lib/hotkeyDefaults";
import {
	useResetHotkeysToDefaults,
	useSetHotkeyEnabled,
	useSettings,
	useShortcutErrors,
	useUpdateHoldHotkey,
	useUpdatePasteLastHotkey,
	useUpdateToggleHotkey,
	useUpdateTranslationHotkey,
} from "../../lib/queries";
import type { HotkeyConfig } from "../../lib/tauri";
import { HotkeyInput } from "../HotkeyInput";

type RecordingInput = "toggle" | "hold" | "paste_last" | "translation" | null;

export function HotkeySettings() {
	const { data: settings, isLoading } = useSettings();
	const { data: shortcutErrors } = useShortcutErrors();
	const updateToggleHotkey = useUpdateToggleHotkey();
	const updateHoldHotkey = useUpdateHoldHotkey();
	const updatePasteLastHotkey = useUpdatePasteLastHotkey();
	const updateTranslationHotkey = useUpdateTranslationHotkey();
	const setHotkeyEnabled = useSetHotkeyEnabled();
	const resetHotkeys = useResetHotkeysToDefaults();

	const [recordingInput, setRecordingInput] = useState<RecordingInput>(null);

	const error =
		updateToggleHotkey.error ||
		updateHoldHotkey.error ||
		updatePasteLastHotkey.error ||
		updateTranslationHotkey.error ||
		setHotkeyEnabled.error ||
		resetHotkeys.error;

	const handleToggleHotkeyChange = (config: HotkeyConfig) => {
		updateToggleHotkey.mutate(config);
	};

	const handleHoldHotkeyChange = (config: HotkeyConfig) => {
		updateHoldHotkey.mutate(config);
	};

	const handlePasteLastHotkeyChange = (config: HotkeyConfig) => {
		updatePasteLastHotkey.mutate(config);
	};

	const handleTranslationHotkeyChange = (config: HotkeyConfig) => {
		updateTranslationHotkey.mutate(config);
	};

	return (
		<div className="settings-section animate-in animate-in-delay-3">
			<h3 className="settings-section-title">Hotkeys</h3>
			{error && (
				<Alert
					icon={<AlertCircle size={16} />}
					color="red"
					mb="md"
					title="Error"
				>
					{error instanceof Error ? error.message : String(error)}
				</Alert>
			)}
			<div className="settings-card">
				<HotkeyInput
					label="Toggle Recording"
					description="Press once to start recording, press again to stop"
					value={settings?.toggle_hotkey ?? DEFAULT_TOGGLE_HOTKEY}
					onChange={handleToggleHotkeyChange}
					disabled={isLoading || updateToggleHotkey.isPending}
					isRecording={recordingInput === "toggle"}
					onStartRecording={() => setRecordingInput("toggle")}
					onStopRecording={() => setRecordingInput(null)}
					enabled={settings?.toggle_hotkey?.enabled ?? true}
					onEnabledChange={(enabled) =>
						setHotkeyEnabled.mutate({ hotkeyType: "toggle", enabled })
					}
					enabledLoading={setHotkeyEnabled.isPending}
					registrationError={shortcutErrors?.toggle_error}
					mutationStatus={updateToggleHotkey.status}
				/>

				<div style={{ marginTop: 20 }}>
					<HotkeyInput
						label="Hold to Record"
						description="Hold to record, release to stop"
						value={settings?.hold_hotkey ?? DEFAULT_HOLD_HOTKEY}
						onChange={handleHoldHotkeyChange}
						disabled={isLoading || updateHoldHotkey.isPending}
						isRecording={recordingInput === "hold"}
						onStartRecording={() => setRecordingInput("hold")}
						onStopRecording={() => setRecordingInput(null)}
						enabled={settings?.hold_hotkey?.enabled ?? true}
						onEnabledChange={(enabled) =>
							setHotkeyEnabled.mutate({ hotkeyType: "hold", enabled })
						}
						enabledLoading={setHotkeyEnabled.isPending}
						registrationError={shortcutErrors?.hold_error}
						mutationStatus={updateHoldHotkey.status}
					/>
				</div>

				<div style={{ marginTop: 20 }}>
					<HotkeyInput
						label="Paste Last Transcription"
						description="Paste the most recent transcription"
						value={settings?.paste_last_hotkey ?? DEFAULT_PASTE_LAST_HOTKEY}
						onChange={handlePasteLastHotkeyChange}
						disabled={isLoading || updatePasteLastHotkey.isPending}
						isRecording={recordingInput === "paste_last"}
						onStartRecording={() => setRecordingInput("paste_last")}
						onStopRecording={() => setRecordingInput(null)}
						enabled={settings?.paste_last_hotkey?.enabled ?? true}
						onEnabledChange={(enabled) =>
							setHotkeyEnabled.mutate({ hotkeyType: "paste_last", enabled })
						}
						enabledLoading={setHotkeyEnabled.isPending}
						registrationError={shortcutErrors?.paste_last_error}
						mutationStatus={updatePasteLastHotkey.status}
					/>
				</div>

				<div style={{ marginTop: 20 }}>
					<HotkeyInput
						label="Voice Translation"
						description="Open language selector and translate speech to selected language"
						value={settings?.translation_hotkey ?? DEFAULT_TRANSLATION_HOTKEY}
						onChange={handleTranslationHotkeyChange}
						disabled={isLoading || updateTranslationHotkey.isPending}
						isRecording={recordingInput === "translation"}
						onStartRecording={() => setRecordingInput("translation")}
						onStopRecording={() => setRecordingInput(null)}
						enabled={settings?.translation_hotkey?.enabled ?? true}
						onEnabledChange={(enabled) =>
							setHotkeyEnabled.mutate({ hotkeyType: "translation", enabled })
						}
						enabledLoading={setHotkeyEnabled.isPending}
						registrationError={shortcutErrors?.translation_error}
						mutationStatus={updateTranslationHotkey.status}
					/>
				</div>

				<div
					style={{
						marginTop: 24,
						paddingTop: 16,
						borderTop: "1px solid var(--mantine-color-dark-4)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Text size="sm" c="dimmed">
						Reset all hotkeys to their default values
					</Text>
					<Tooltip label="Reset to Defaults" withArrow>
						<ActionIcon
							variant="light"
							color="gray"
							size="lg"
							onClick={() => resetHotkeys.mutate()}
							loading={resetHotkeys.isPending}
							disabled={isLoading}
						>
							<RotateCcw size={14} />
						</ActionIcon>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
