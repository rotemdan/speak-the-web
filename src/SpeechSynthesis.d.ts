/*
declare interface SpeechSynthesisVoice {
	readonly default: boolean;
	readonly lang: string;
	readonly localService: boolean;
	readonly name: string;
	readonly voiceURI: string;
}
*/
declare interface UtteranceEvent extends Event {
	name: "word" | "sentence";
	utterance: SpeechSynthesisUtterance;
	charIndex: number;
	elapsedTime: number;
}
/*
declare class SpeechSynthesisUtterance {
	constructor(text: string);

	lang: string;
	pitch: number;
	rate: number;
	text: string;
	voice: SpeechSynthesisVoice;
	volume: number;

	onboundary: (event: UtteranceEvent) => void;
	onend: (event: UtteranceEvent) => void;
	onerror: (event: Event & { error: any }) => void;
	onmark: (event: Event) => void;
	onpause: (event: Event) => void;
	onresume: (event: Event) => void;
	onstart: (event: Event) => void;
}

declare class SpeechSynthesis {
	readonly pending: boolean;
	readonly speaking: boolean;
	readonly paused: boolean;

	cancel(): void;
	getVoices(): SpeechSynthesisVoice[];
	pause(): void;
	resume(): void;
	speak(utterance: SpeechSynthesisUtterance): void;
}

declare var speechSynthesis: SpeechSynthesis;
*/
