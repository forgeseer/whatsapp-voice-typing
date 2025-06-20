import React, { useEffect, useState, useCallback, useMemo } from "react";
import { X, Mic, MicOff, AlertCircle, Copy, Check, Loader } from "lucide-react";
import Waveform from "./Waveform";
import { useVoiceProcessor } from "~hooks/useVoiceProcessor";

interface VoiceModalProps {
    onClose: () => void;
}

type ModalState = 'listening' | 'stopped' | 'error';
type CopyState = 'idle' | 'copying' | 'success' | 'error';

const VoiceModal: React.FC<VoiceModalProps> = ({ onClose }) => {
    const { isListening, transcript, startListening, stopListening, frequencyData, error, setError } = useVoiceProcessor();
    const [modalState, setModalState] = useState<ModalState>('listening');
    const [copyState, setCopyState] = useState<CopyState>('idle');
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (error) {
            setModalState('error');
        } else if (isListening) {
            setModalState('listening');
        } else {
            setModalState('stopped');
        }
    }, [error, isListening]);

    // Auto-start recording when modal opens
    useEffect(() => {
        const initializeRecording = async () => {
            try {
                await startListening();
            } catch (err) {
                setError("Failed to initialize voice recording");
            }
        };

        initializeRecording();

        return () => {
            stopListening();
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        if (isListening) {
            stopListening();
        }
        setTimeout(() => {
            onClose();
        }, 200);
    }, [isListening, stopListening, onClose]);

    const handleCopy = useCallback(async () => {
        if (!transcript.trim()) return;

        setCopyState('copying');

        try {
            await navigator.clipboard.writeText(transcript);
            setCopyState('success');
            setTimeout(() => setCopyState('idle'), 2000);
        } catch (err) {
            setCopyState('error');
            setTimeout(() => setCopyState('idle'), 2000);
        }
    }, [transcript]);

    const handleToggleRecording = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            setError(null);
            startListening();
        }
    }, [isListening, stopListening, startListening, setError]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            } else if (e.key === ' ' && e.ctrlKey && transcript) {
                e.preventDefault();
                handleCopy();
            } else if (e.key === ' ' && !e.ctrlKey) {
                e.preventDefault();
                handleToggleRecording();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleClose, handleCopy, handleToggleRecording, transcript]);

    const getErrorMessage = useCallback((errorMsg: string) => {
        if (errorMsg.includes('not-allowed')) {
            return "Microphone access denied";
        }
        if (errorMsg.includes('device not found')) {
            return "No microphone detected";
        }
        if (errorMsg.includes('not supported')) {
            return "Speech recognition not supported";
        }
        if (errorMsg.includes('network')) {
            return "Network connection error";
        }
        return "Recording failed";
    }, []);

    const getCopyButtonContent = () => {
        switch (copyState) {
            case 'copying':
                return { icon: <Loader className="animate-spin" size={16} />, text: 'Copying...' };
            case 'success':
                return { icon: <Check size={16} />, text: 'Copied!' };
            case 'error':
                return { icon: <AlertCircle size={16} />, text: 'Failed' };
            default:
                return { icon: <Copy size={16} />, text: 'Copy' };
        }
    };

    const copyButton = getCopyButtonContent();

    return (
        <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
                }`}
            onClick={handleClose}
        >
            <div
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[450px] max-w-[90vw] transition-all duration-300 transform ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Voice to Text
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Status indicator */}
                    <div className="flex items-center justify-center mb-6">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium ${modalState === 'listening'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : modalState === 'error'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {modalState === 'listening' && <Mic className="animate-pulse" size={16} />}
                            {modalState === 'error' && <AlertCircle size={16} />}
                            {modalState === 'stopped' && <MicOff size={16} />}

                            {modalState === 'listening' && 'Recording...'}
                            {modalState === 'error' && getErrorMessage(error || '')}
                            {modalState === 'stopped' && 'Recording stopped'}
                        </div>
                    </div>

                    {/* Waveform */}
                    <div className="mb-6 h-16 flex items-center justify-center rounded-xl">
                        <Waveform frequencyData={frequencyData} />
                    </div>

                    {/* Transcript */}
                    <div className="mb-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 min-h-[100px] flex items-center justify-center">
                            {transcript ? (
                                <p className="text-gray-900 dark:text-white text-center leading-relaxed">
                                    "{transcript}"
                                </p>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center italic">
                                    {modalState === 'listening'
                                        ? "Speak now..."
                                        : modalState === 'error'
                                            ? "Try recording again"
                                            : "No text captured"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleToggleRecording}
                            disabled={modalState === 'error' && !error}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${isListening
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30'
                                }`}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            {isListening ? 'Stop Recording' : 'Start Recording'}
                        </button>

                        <button
                            onClick={handleCopy}
                            disabled={!transcript.trim() || copyState === 'copying'}
                            className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all ${!transcript.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                : copyState === 'success'
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30'
                                    : copyState === 'error'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
                                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900'
                                }`}
                        >
                            {copyButton.icon}
                            {copyButton.text}
                        </button>
                    </div>

                    {/* Keyboard shortcuts */}
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd> to toggle recording
                            {transcript && (
                                <>
                                    {' • '}
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl + Space</kbd> to copy
                                </>
                            )}
                            {' • '}
                            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceModal;