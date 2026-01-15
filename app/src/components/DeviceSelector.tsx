import { Select } from "@mantine/core";
import { useEffect, useState } from "react";
import {
	type AudioDeviceInfo,
	listNativeAudioDevices,
} from "../lib/nativeAudio";
import { useSettings, useUpdateSelectedMic } from "../lib/queries";

export function DeviceSelector() {
	const { data: settings, isLoading: settingsLoading } = useSettings();
	const updateSelectedMic = useUpdateSelectedMic();
	const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadDevices() {
			try {
				// Use native device enumeration via cpal (bypasses browser permission)
				const nativeDevices = await listNativeAudioDevices();
				setDevices(nativeDevices);
				setError(null);
			} catch (err) {
				setError("Could not access microphones.");
				console.error("Failed to enumerate devices:", err);
			} finally {
				setIsLoading(false);
			}
		}

		loadDevices();

		// Periodically refresh device list (native API doesn't have change events)
		const intervalId = setInterval(loadDevices, 5000);

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	const handleChange = (value: string | null) => {
		// null or empty string means "default"
		const micId = value === "" || value === "default" ? null : value;
		updateSelectedMic.mutate(micId);
	};

	if (isLoading || settingsLoading) {
		return (
			<div>
				<p className="settings-label">Microphone</p>
				<p className="settings-description">Loading microphones...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<p className="settings-label">Microphone</p>
				<p className="settings-description" style={{ color: "#ef4444" }}>
					{error}
				</p>
			</div>
		);
	}

	const selectData = [
		{ value: "default", label: "System Default" },
		...devices.map((device) => ({
			value: device.id,
			label: device.name,
		})),
	];

	return (
		<Select
			label="Microphone"
			description="Select which microphone to use for dictation"
			data={selectData}
			value={settings?.selected_mic_id ?? "default"}
			onChange={handleChange}
			allowDeselect={false}
			className="device-selector"
		/>
	);
}
