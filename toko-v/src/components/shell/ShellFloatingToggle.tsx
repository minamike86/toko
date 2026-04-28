"use client";

import { useEffect, useRef, useState } from "react";

interface ShellFloatingToggleProps {
  isSidebarHidden: boolean;
  onToggle: () => void;
}

interface Position {
  x: number;
  y: number;
}

const BUTTON_SIZE = 48;
const VIEWPORT_PADDING = 12;
const DEFAULT_POSITION: Position = { x: 12, y: 88 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getBoundedPosition(position: Position): Position {
  const maxX = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - BUTTON_SIZE - VIEWPORT_PADDING,
  );
  const maxY = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - BUTTON_SIZE - VIEWPORT_PADDING,
  );

  return {
    x: clamp(position.x, VIEWPORT_PADDING, maxX),
    y: clamp(position.y, VIEWPORT_PADDING, maxY),
  };
}

export function ShellFloatingToggle({
  isSidebarHidden,
  onToggle,
}: ShellFloatingToggleProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);

  const pointerOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    function handleResize(): void {
      setPosition((current) => getBoundedPosition(current));
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    const rect = event.currentTarget.getBoundingClientRect();

    pointerOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    dragDistanceRef.current = 0;
    setIsDragging(true);

    // SAFE GUARD (IMPORTANT FIX)
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (!isDragging) {
      return;
    }

    const nextPosition = getBoundedPosition({
      x: event.clientX - pointerOffsetRef.current.x,
      y: event.clientY - pointerOffsetRef.current.y,
    });

    dragDistanceRef.current += Math.abs(nextPosition.x - position.x);
    dragDistanceRef.current += Math.abs(nextPosition.y - position.y);

    setPosition(nextPosition);
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    // SAFE GUARD (IMPORTANT FIX)
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const treatedAsClick = dragDistanceRef.current < 6;

    setIsDragging(false);

    if (treatedAsClick) {
      onToggle();
    }
  }

  function handlePointerCancel(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    dragDistanceRef.current = 0;
  }

  return (
    <button
      type="button"
      aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-md transition ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab hover:bg-slate-50"
        }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
    >
      {isSidebarHidden ? "☰" : "✕"}
    </button>
  );
}