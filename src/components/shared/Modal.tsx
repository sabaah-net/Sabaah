'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ id, open, onClose, title, children }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open', open);
  }, [open, id]);

  return (
    <div className="modal-overlay" id={id} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet" ref={sheetRef}>
        <div className="modal-handle" />
        {title && <div className="modal-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
