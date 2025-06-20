import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useState } from "react";

// FOR TESTING: Set thresholds to 0 to show the modal immediately.
// REMEMBER to set these back to higher values before publishing!
const FEEDBACK_THRESHOLD_DAYS = 5; // Original: 5
const ACTIVATION_THRESHOLD = 10;   // Original: 10

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000;
const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000;

interface FeedbackStatus {
    state: 'not-prompted' | 'submitted' | 'dismissed-long' | 'dismissed-short';
    nextPromptTime?: number;
}

export const useFeedback = () => {
    const [firstInstallTime] = useStorage<number>("first-install-time", () => Date.now());
    const [activationCount, setActivationCount] = useStorage<number>("activation-count", 0);
    const [feedbackStatus, setFeedbackStatus] = useStorage<FeedbackStatus>("feedback-status", { state: 'not-prompted' });

    const [shouldShowFeedback, setShouldShowFeedback] = useState(false);

    useEffect(() => {
        if (feedbackStatus.state === 'submitted') {
            setShouldShowFeedback(false);
            return;
        }

        if ((feedbackStatus.state === 'dismissed-long' || feedbackStatus.state === 'dismissed-short')) {
            if (Date.now() > (feedbackStatus.nextPromptTime || 0)) {
                setShouldShowFeedback(true);
            }
            return;
        }

        if (feedbackStatus.state === 'not-prompted') {
            const daysSinceInstall = (Date.now() - firstInstallTime) / (1000 * 60 * 60 * 24);
            if (daysSinceInstall >= FEEDBACK_THRESHOLD_DAYS && activationCount >= ACTIVATION_THRESHOLD) {
                setShouldShowFeedback(true);
            }
        }
    }, [firstInstallTime, activationCount, feedbackStatus]);

    const handleFeedbackModalClose = (action: 'feedback' | 'dismiss' | 'close') => {
        let newStatus: FeedbackStatus;

        switch (action) {
            case 'feedback':
                newStatus = { state: 'submitted' };
                break;
            case 'dismiss':
                newStatus = { state: 'dismissed-long', nextPromptTime: Date.now() + FIVE_DAYS_IN_MS };
                break;
            case 'close':
                newStatus = { state: 'dismissed-short', nextPromptTime: Date.now() + ONE_DAY_IN_MS };
                break;
        }

        setFeedbackStatus(newStatus);
        setShouldShowFeedback(false);
    };

    const incrementActivationCount = () => {
        setActivationCount(count => count + 1);
    };

    return { shouldShowFeedback, handleFeedbackModalClose, incrementActivationCount };
};