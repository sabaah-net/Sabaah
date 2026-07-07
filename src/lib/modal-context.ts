'use client';
import { createContext, useContext } from 'react';

export interface ModalState {
  auth: boolean;
  pay: boolean;
  topUp: boolean;
  subs: boolean;
  lang: boolean;
  voice: boolean;
  notif: boolean;
  orderSuccess: boolean;
}

export const ModalCtx = createContext<{
  open: (key: keyof ModalState) => void;
  close: (key: keyof ModalState) => void;
}>({ open: () => {}, close: () => {} });

export const useModal = () => useContext(ModalCtx);
