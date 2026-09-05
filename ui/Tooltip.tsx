import { css, cx } from '@emotion/css';
import { RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { applyVar } from './cssVar.tsx';
import pixelBorder from './pixelBorder.tsx';
import Portal from './Portal.tsx';

type Side = 'left' | 'right';

/**
 * Portal tooltip tied to a host element ref. Survives zoom/transform ancestors
 * (e.g. playground inlineUI) and shows on pointer enter / focus.
 */
export function TooltipPortal({
  hostRef,
  label,
  side = 'left',
}: {
  hostRef: RefObject<HTMLElement | null>;
  label: string | undefined;
  side?: Side;
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const update = useCallback(() => {
    const host = hostRef.current;
    if (!host || !label) {
      setCoords(null);
      return;
    }
    const rect = host.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: side === 'left' ? rect.left - 8 : rect.right + 8,
    });
  }, [hostRef, label, side]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !label) {
      setVisible(false);
      return;
    }

    const show = () => {
      update();
      setVisible(true);
    };
    const hide = () => setVisible(false);

    host.addEventListener('pointerenter', show);
    host.addEventListener('pointerleave', hide);
    host.addEventListener('focusin', show);
    host.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);

    return () => {
      host.removeEventListener('pointerenter', show);
      host.removeEventListener('pointerleave', hide);
      host.removeEventListener('focusin', show);
      host.removeEventListener('focusout', hide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [hostRef, label, update]);

  useLayoutEffect(() => {
    if (visible) {
      update();
    }
  }, [visible, update]);

  if (!visible || !coords || !label) {
    return null;
  }

  return (
    <Portal>
      <span
        className={cx(tooltipBubbleStyle, side === 'right' ? bubbleRightStyle : bubbleLeftStyle)}
        role="tooltip"
        style={{ top: coords.top, left: coords.left }}
      >
        {label}
      </span>
    </Portal>
  );
}

const tooltipBubbleStyle = css`
  ${pixelBorder(applyVar('background-color-dark'), 2)}

  background: ${applyVar('background-color-dark')};
  color: ${applyVar('text-color-bright')};
  font-size: 12px;
  font-weight: normal;
  letter-spacing: 0;
  line-height: 1.2;
  padding: 6px 8px 4px;
  pointer-events: none;
  position: fixed;
  white-space: nowrap;
  z-index: 10000;
`;

const bubbleLeftStyle = css`
  transform: translate(-100%, -50%);
`;

const bubbleRightStyle = css`
  transform: translateY(-50%);
`;
