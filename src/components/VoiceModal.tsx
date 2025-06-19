import React, { useEffect } from "react";
import { X } from "lucide-react";
import Waveform from "./Waveform";
import { useVoiceProcessor } from "~hooks/useVoiceProcessor";
import { WHATSAPP_INPUT_SELECTOR } from "~constants/whatsapp";

interface VoiceModalProps {
    onClose: () => void;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ onClose }) => {
    const { isListening, transcript, startListening, stopListening, frequencyData, error, setError } = useVoiceProcessor();

    useEffect(() => {
        startListening();
        return () => {
            stopListening();
        };
    }, []);

    useEffect(() => {
        if (!isListening && transcript) {
            const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);

            if (inputBox) {
                (inputBox as HTMLElement).focus();
                document.execCommand("insertText", false, transcript);
                onClose();
            } else {
                setError("Please open a chat to send the message.");
            }
        }
    }, [isListening, transcript, onClose, setError]);

    const handleManualClose = () => {
        if (isListening) {
            stopListening();
        } else {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-white border border-white/20 shadow-2xl w-[350px] flex flex-col items-center">
                <button onClick={handleManualClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <div className="text-lg font-medium mb-4">
                    {isListening ? "Listening..." : (error ? "Error" : "Processing...")}
                </div>
                <Waveform frequencyData={frequencyData} />
                <p className="mt-4 text-center text-sm min-h-[40px] text-white/80">
                    {error ? error : (transcript || "Say something...")}
                </p>
            </div>
        </div>
    );
};

export default VoiceModal;