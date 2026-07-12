import { useEffect, useState, useRef } from 'react';

interface CustomCursorProps {
  enable?: boolean;
}

export function CustomCursor({ enable = true }: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dotPosRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (!enable) {
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    // Check if the device has touch capabilities / fine pointer support
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      
      const touchActive = hasTouch || isCoarse;
      setIsTouch(touchActive);

      if (!touchActive) {
        document.body.classList.add('custom-cursor-active');
      }
    };

    checkTouchDevice();

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Expand outer circle on hovering interactive controls
      if (target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer')) {
        setIsHovering(true);
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer')) {
        setIsHovering(false);
      }
    };

    const onMouseLeave = () => {
      isVisibleRef.current = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Initial positioning to prevent jump
    dotPosRef.current = { x: mouseRef.current.x, y: mouseRef.current.y };
    ringPosRef.current = { x: mouseRef.current.x, y: mouseRef.current.y };

    const updateCursorPositions = () => {
      const ringEase = 0.15; // Speed factor for the trailing outer ring lag
      
      // Update dot position instantly to match physical cursor responsiveness
      dotPosRef.current = { x: mouseRef.current.x, y: mouseRef.current.y };

      // Interpolate ring position for the trailing dynamic glow effect
      const ringDx = mouseRef.current.x - ringPosRef.current.x;
      const ringDy = mouseRef.current.y - ringPosRef.current.y;
      ringPosRef.current.x += ringDx * ringEase;
      ringPosRef.current.y += ringDy * ringEase;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPosRef.current.x}px, ${dotPosRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPosRef.current.x}px, ${ringPosRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      requestRef.current = requestAnimationFrame(updateCursorPositions);
    };

    requestRef.current = requestAnimationFrame(updateCursorPositions);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enable]);

  // Render nothing on touch screens or if disabled
  if (isTouch || !enable) return null;

  return (
    <>
      <div
        ref={dotRef}
        className={`custom-cursor-dot ${isHovering ? 'hovering' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ opacity: 0, transition: 'width 0.2s ease, height 0.2s ease, background-color 0.2s ease, opacity 0.15s ease' }}
      />
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${isHovering ? 'hovering' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ opacity: 0, transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, background-color 0.25s ease, opacity 0.15s ease' }}
      />
    </>
  );
}
