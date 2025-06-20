import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { WHATSAPP_VOICE_TYPING_FEEDBACK_LINK } from '~constants/whatsapp';

interface FeedbackModalProps {
    onClose: (action: 'feedback' | 'dismiss' | 'close') => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = (action: 'feedback' | 'dismiss' | 'close') => {
        setIsClosing(true);
        setTimeout(() => {
            onClose(action);
        }, 300);
    };

    const handleFeedbackClick = () => {
        window.open(WHATSAPP_VOICE_TYPING_FEEDBACK_LINK, '_blank');
        handleClose('feedback');
    };

    return (
        <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
                }`}
            onClick={() => handleClose('close')}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[400px] max-w-[90vw] p-8 transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full mb-4">
                        <ThumbsUp className="text-blue-500 dark:text-blue-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enjoying Voice Typing for WhatsApp™?</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        This extension is free and made by an 18-year-old high school student. Your feedback is incredibly valuable to make it even better.
                    </p>
                    <div className="flex flex-col w-full space-y-3">
                        <button
                            onClick={handleFeedbackClick}
                            className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all shadow-md"
                        >
                            Leave Feedback
                        </button>
                        <button
                            onClick={() => handleClose('dismiss')}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                            Don't show again
                        </button>
                    </div>
                    <button
                        onClick={() => handleClose('close')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-6 text-sm"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;