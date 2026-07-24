import React from "react";
import UIModal from "./ui/Modal";

/**
 * Legacy Modal API — kept for backwards compatibility.
 * It now delegates to the premium `ui/Modal` so every existing consumer
 * (invite modals, etc.) automatically gets the new animated, glassmorphic
 * dialog with a consistent header, blur backdrop, and responsive bottom-sheet.
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => (
  <UIModal open={isOpen} onClose={onClose} title={title} size={size}>
    {children}
  </UIModal>
);

export default Modal;
