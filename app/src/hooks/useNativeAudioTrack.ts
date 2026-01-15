import { useCallback, useEffect, useRef, useState } from "react";
import {
	createNativeAudioBridge,
	type NativeAudioBridge,
} from "../lib/nativeAudio";

interface UseNativeAudioTrackResult {
	/** The MediaStreamTrack from native audio capture, or null if not ready */
	track: MediaStreamTrack | null;
	/** Whether the native audio bridge has been initialized */
	isReady: boolean;
	/** Error if initialization failed */
	error: Error | null;
	/** Start capturing audio from the specified device (by ID) */
	start: (deviceId?: string) => Promise<void>;
	/** Stop capturing and release resources */
	stop: () => void;
	/** Pause capture (stream stays alive for fast resume) */
	pause: () => void;
	/** Resume capture after pause */
	resume: () => void;
}

/**
 * React hook for native audio capture via cpal.
 *
 * Initializes the native audio bridge on mount and provides
 * a MediaStreamTrack that can be used with WebRTC.
 *
 * This bypasses the browser's getUserMedia() which has ~300-400ms latency
 * on macOS due to security overhead. Native capture has ~10-20ms latency.
 */
export function useNativeAudioTrack(): UseNativeAudioTrackResult {
	const bridgeRef = useRef<NativeAudioBridge | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let mounted = true;

		const init = async () => {
			try {
				const bridge = await createNativeAudioBridge();
				if (mounted) {
					bridgeRef.current = bridge;
					setIsReady(true);
				}
			} catch (err) {
				console.error("[NativeAudio] Failed to initialize:", err);
				if (mounted) {
					setError(err instanceof Error ? err : new Error(String(err)));
				}
			}
		};

		init();

		return () => {
			mounted = false;
			bridgeRef.current?.stop();
		};
	}, []);

	const start = useCallback(async (deviceId?: string) => {
		await bridgeRef.current?.start(deviceId);
	}, []);

	const stop = useCallback(() => {
		bridgeRef.current?.stop();
	}, []);

	const pause = useCallback(() => {
		bridgeRef.current?.pause();
	}, []);

	const resume = useCallback(() => {
		bridgeRef.current?.resume();
	}, []);

	return {
		track: bridgeRef.current?.track ?? null,
		isReady,
		error,
		start,
		stop,
		pause,
		resume,
	};
}
