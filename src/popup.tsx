import React from "react";
import "./style.css";

function IndexPopup() {
  return (
    <div className="w-80 p-6 bg-gray-900 text-white flex flex-col items-center">
      <h1 className="text-xl font-bold mb-2">Voice Typing for WhatsApp™</h1>
      <p className="text-sm text-gray-400 text-center">
        Go to WhatsApp Web to use the extension. A draggable microphone button will appear.
      </p>
    </div>
  );
}

export default IndexPopup;