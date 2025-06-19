import { useState, useEffect, useRef, useCallback } from "react";
import type { SpeechRecognition } from "~types/global";

type VoiceProcessorState = {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    error: string | null;
    setError: (error: string | null) => void;
    frequencyData: Uint8Array | null;
};

export const useVoiceProcessor = (): VoiceProcessorState => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>(0);

    const cleanupAudio = useCallback(() => {
        cancelAnimationFrame(animationFrameRef.current);
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current?.state !== "closed") {
            audioContextRef.current?.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;
    }, []);

    const processAudio = useCallback(() => {
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            setFrequencyData(new Uint8Array(dataArrayRef.current));
        }
        animationFrameRef.current = requestAnimationFrame(processAudio);
    }, []);

    const startListening = useCallback(async () => {
        setError(null);
        setTranscript("");

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new window.AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current.connect(analyserRef.current);

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error("Speech Recognition API is not supported in this browser.");
            }

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = "en-US";
            recognitionRef.current.interimResults = true;
            recognitionRef.current.continuous = true;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                processAudio();
            };

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    finalTranscript += event.results[i][0].transcript;
                }
                setTranscript(finalTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                setError(event.error);
                stopListening();
            };

            recognitionRef.current.onend = () => {
                stopListening();
            };

            recognitionRef.current.start();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            cleanupAudio();
        }
    }, [processAudio, cleanupAudio]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        cleanupAudio();
        setIsListening(false);
    }, [cleanupAudio]);

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return { isListening, transcript, startListening, stopListening, error, frequencyData, setError };
};