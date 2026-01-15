import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

const SAMPLE_RATE = 48000;

/**
 * Information about a native audio input device.
 */
export interface AudioDeviceInfo {
	/** Stable unique identifier (persists across reboots) */
	id: string;
	/** Human-readable device name for display */
	name: string;
}

/**
 * List available native audio input devices via cpal.
 * Returns device info with both stable ID and human-readable name.
 */
export async function listNativeAudioDevices(): Promise<AudioDeviceInfo[]> {
	return invoke<AudioDeviceInfo[]>("list_native_mic_devices");
}

export interface NativeAudioBridge {
	track: MediaStreamTrack;
	start: (deviceId?: string) => Promise<void>;
	stop: () => void;
	pause: () => void;
	resume: () => void;
}

/**
 * Creates a MediaStreamTrack from native audio capture via cpal.
 *
 * Architecture:
 * Rust (cpal) → Tauri Event → AudioWorklet → MediaStreamDestination → MediaStreamTrack
 *
 * This bypasses the browser's getUserMedia() which has ~300-400ms latency on macOS
 * due to security overhead. Native capture via cpal has ~10-20ms latency.
 */
export async function createNativeAudioBridge(): Promise<NativeAudioBridge> {
	// Create AudioContext with matching sample rate
	const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

	// Load AudioWorklet processor
	await audioContext.audioWorklet.addModule("/native-audio-processor.js");

	// Create worklet node
	const workletNode = new AudioWorkletNode(
		audioContext,
		"native-audio-processor",
	);

	// Create destination to get MediaStreamTrack
	const destination = audioContext.createMediaStreamDestination();
	workletNode.connect(destination);

	// Get the audio track
	const track = destination.stream.getAudioTracks()[0];
	if (!track) {
		throw new Error("Failed to create audio track from MediaStreamDestination");
	}

	// Listen for native audio data events
	let unlisten: UnlistenFn | undefined;

	const start = async (deviceId?: string): Promise<void> => {
		// Resume audio context (required for autoplay policy)
		if (audioContext.state === "suspended") {
			await audioContext.resume();
		}

		// Start listening for audio data from Rust (if not already listening)
		if (!unlisten) {
			unlisten = await listen<number[]>("native-audio-data", (event) => {
				workletNode.port.postMessage({
					type: "audio-data",
					samples: event.payload,
				});
			});
		}

		// Start native capture
		await invoke("start_native_mic", { deviceId });
	};

	const stop = (): void => {
		invoke("stop_native_mic");
		unlisten?.();
		unlisten = undefined;
	};

	const pause = (): void => {
		invoke("pause_native_mic");
	};

	const resume = (): void => {
		invoke("resume_native_mic");
	};

	return { track, start, stop, pause, resume };
}
