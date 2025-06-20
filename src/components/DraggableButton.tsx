import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Mic } from "lucide-react";
import { useStorage } from "@plasmohq/storage/hook";
import VoiceModal from "./VoiceModal";
import { useFeedback } from "~hooks/useFeedback";
import FeedbackModal from "./FeedbackModal";

interface Position {
    x: number;
    y: number;
}

const DraggableButton: React.FC = () => {
    const defaultPosition = useMemo(() => ({
        x: 30,
        y: Math.max(100, window.innerHeight - 100)
    }), []);

    const [savedPosition, setSavedPosition] = useStorage<Position>("button-position", defaultPosition);
    const [position, setPosition] = useState<Position>(savedPosition);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { shouldShowFeedback, handleFeedbackModalClose, incrementActivationCount } = useFeedback();

    const dragDataRef = useRef<{
        startPos: Position;
        offset: Position;
        hasMoved: boolean;
    }>({
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
        hasMoved: false
    });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const rafRef = useRef<number>();
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!isDragging) {
            setPosition(savedPosition);
        }
    }, [savedPosition, isDragging]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const constrainPosition = useCallback((x: number, y: number): Position => {
        const buttonSize = 64;
        return {
            x: Math.max(0, Math.min(x, window.innerWidth - buttonSize)),
            y: Math.max(0, Math.min(y, window.innerHeight - buttonSize))
        };
    }, []);

    const debouncedSave = useCallback((pos: Position) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            setSavedPosition(pos);
        }, 100);
    }, [setSavedPosition]);


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            const newPos = constrainPosition(
                e.clientX - dragDataRef.current.offset.x,
                e.clientY - dragDataRef.current.offset.y
            );

            const threshold = 3;
            if (Math.abs(newPos.x - dragDataRef.current.startPos.x) > threshold ||
                Math.abs(newPos.y - dragDataRef.current.startPos.y) > threshold) {
                dragDataRef.current.hasMoved = true;
            }

            setPosition(newPos);
        });
    }, [constrainPosition]);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
        incrementActivationCount();
    }, [incrementActivationCount]);


    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        setIsDragging(false);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("mouseleave", handleMouseUp);

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = undefined;
        }

        const finalPos = constrainPosition(
            e.clientX - dragDataRef.current.offset.x,
            e.clientY - dragDataRef.current.offset.y
        );

        setPosition(finalPos);
        debouncedSave(finalPos);

        if (!dragDataRef.current.hasMoved) {
            handleOpenModal();
        }
    }, [handleMouseMove, constrainPosition, debouncedSave]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        dragDataRef.current = {
            startPos: { x: e.clientX, y: e.clientY },
            offset,
            hasMoved: false
        };

        setIsDragging(true);

        document.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.addEventListener("mouseup", handleMouseUp, { passive: true });
        document.addEventListener("mouseleave", handleMouseUp, { passive: true });
    }, [handleMouseMove, handleMouseUp]);

    const buttonStyle = useMemo(() => ({
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? 'transform' : 'auto'
    }), [position.x, position.y, isDragging]);

    const buttonClassName = useMemo(() =>
        `fixed w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform duration-200 z-[9998] ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
        }`
        , [isDragging]);

    return (
        <>
            <button
                ref={buttonRef}
                style={buttonStyle}
                className={buttonClassName}
                onMouseDown={handleMouseDown}
                type="button"
                aria-label="Voice recording button"
            >
                <Mic size={28} />
            </button>
            {isModalOpen && <VoiceModal onClose={handleCloseModal} />}
            {shouldShowFeedback && <FeedbackModal onClose={handleFeedbackModalClose} />}
        </>
    );
};

export default DraggableButton;