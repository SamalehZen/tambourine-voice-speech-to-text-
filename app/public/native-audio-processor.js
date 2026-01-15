/**
 * AudioWorklet processor that receives native audio data via port messages
 * and outputs it as PCM samples for WebRTC consumption.
 *
 * This processor bridges native audio captured by cpal (Rust) to the Web Audio API,
 * allowing the audio to be converted to a MediaStreamTrack for WebRTC.
 *
 * Implementation notes:
 * - Uses a circular/ring buffer for O(1) read/write (critical for real-time audio)
 * - Float32Array.set() for bulk memory copies instead of element-by-element
 * - Handles wrap-around when data spans the buffer boundary
 * - See: https://en.wikipedia.org/wiki/Circular_buffer
 */
class NativeAudioProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		// Ring buffer for efficient O(1) read/write
		// Size: ~100ms of audio at 48kHz (enough to handle jitter)
		this.bufferSize = 4800;
		this.buffer = new Float32Array(this.bufferSize);
		this.writeIndex = 0;
		this.readIndex = 0;
		this.availableSamples = 0;

		// Receive audio data from main thread
		this.port.onmessage = (event) => {
			if (event.data.type === "audio-data") {
				const samples = new Float32Array(event.data.samples);
				const len = samples.length;

				// Write samples to ring buffer (handle wrap-around)
				const firstPart = Math.min(len, this.bufferSize - this.writeIndex);
				this.buffer.set(samples.subarray(0, firstPart), this.writeIndex);

				if (firstPart < len) {
					// Wrap around to beginning
					this.buffer.set(samples.subarray(firstPart), 0);
				}

				this.writeIndex = (this.writeIndex + len) % this.bufferSize;
				this.availableSamples = Math.min(
					this.availableSamples + len,
					this.bufferSize,
				);
			}
		};
	}

	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 * @returns {boolean}
	 */
	process(_inputs, outputs, _parameters) {
		const output = outputs[0];
		const channel = output[0];
		const frameSize = 128; // AudioWorklet frame size

		if (channel) {
			if (this.availableSamples >= frameSize) {
				// Read samples from ring buffer (handle wrap-around)
				const firstPart = Math.min(frameSize, this.bufferSize - this.readIndex);
				channel.set(
					this.buffer.subarray(this.readIndex, this.readIndex + firstPart),
				);

				if (firstPart < frameSize) {
					// Wrap around - read remaining from beginning
					channel.set(
						this.buffer.subarray(0, frameSize - firstPart),
						firstPart,
					);
				}

				this.readIndex = (this.readIndex + frameSize) % this.bufferSize;
				this.availableSamples -= frameSize;
			} else {
				// Buffer underrun - fill with silence
				channel.fill(0);
			}
		}

		return true; // Keep processor alive
	}
}

registerProcessor("native-audio-processor", NativeAudioProcessor);
