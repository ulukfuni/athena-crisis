'use client';

import { css } from '@emotion/css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

export type ProgressionToastItem = Readonly<{
  id: string;
  text: string;
}>;

export default function ProgressionToast({
  items,
  onDismiss,
}: {
  items: ReadonlyArray<ProgressionToastItem>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className={containerStyle}>
      <AnimatePresence>
        {items.map((item) => (
          <ToastRow key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastRow({
  item,
  onDismiss,
}: {
  item: ProgressionToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 2800);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={toastStyle}
      exit={{ opacity: 0, y: 12 }}
      initial={{ opacity: 0, y: 12 }}
    >
      {item.text}
    </motion.div>
  );
}

const containerStyle = css`
  pointer-events: none;
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const toastStyle = css`
  background: rgba(20, 24, 36, 0.92);
  color: #f5f7ff;
  border: 2px solid #c9a227;
  border-radius: 6px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;
