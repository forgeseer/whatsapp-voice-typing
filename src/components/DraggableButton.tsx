import React, { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { useStorage } from "@plasmohq/storage/hook";
import VoiceModal from "./VoiceModal";

const DraggableButton: React.FC = () => {
    const [savedPosition, setSavedPosition] = useStorage("button-position", { x: 30, y: window.innerHeight - 100 });
    const [livePosition, setLivePosition] = useState({ x: 0, y: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setLivePosition(savedPosition);
    }, [savedPosition]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                setIsModalOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);



    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        if (!buttonRef.current) return;

        const offset = {
            x: e.clientX - buttonRef.current.getBoundingClientRect().left,
            y: e.clientY - buttonRef.current.getBoundingClientRect().top
        }

        const handleMouseMove = (moveEvent: MouseEvent) => {
            let newX = moveEvent.clientX - offset.x;
            let newY = moveEvent.clientY - offset.y;

            newX = Math.max(0, Math.min(newX, window.innerWidth - 64));
            newY = Math.max(0, Math.min(newY, window.innerHeight - 64));

            setLivePosition({ x: newX, y: newY });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            setSavedPosition(livePosition);

            const movedX = Math.abs(dragStartPosRef.current.x - upEvent.clientX);
            const movedY = Math.abs(dragStartPosRef.current.y - upEvent.clientY);
            const dragThreshold = 5;

            if (movedX < dragThreshold && movedY < dragThreshold) {
                setIsModalOpen(true);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <>
            <button
                ref={buttonRef}
                style={{ top: livePosition.y, left: livePosition.x }}
                className="fixed w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl cursor-grab transition-transform duration-200 hover:scale-105 z-[9998]"
                onMouseDown={handleMouseDown}
            >
                <Mic size={28} />
            </button>
            {isModalOpen && <VoiceModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default DraggableButton;