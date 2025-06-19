import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import DraggableButton from "~components/DraggableButton";
import styleText from "data-text:~/style.css";

export const config: PlasmoCSConfig = {
  matches: ["https://web.whatsapp.com/"],
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

const ContentUI = () => {
  return <DraggableButton />;
};

export default ContentUI;