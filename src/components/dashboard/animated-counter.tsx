"use client";

import { useEffect, useRef, useState } from "react";
import { formatCompact, formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  format?: "number" | "currency" | "percent" | "compact";
  currency?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  format = "number",
  currency = "USD",
  className,
  duration = 1200,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const prevValueRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const fromValue = prevValueRef.current;
    const toValue = value;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(fromValue + (toValue - fromValue) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = toValue;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      prevValueRef.current = toValue;
    };
  }, [value, duration]);

  let formatted: string;
  switch (format) {
    case "currency":
      formatted = formatCurrency(display, currency);
      break;
    case "percent":
      formatted = formatPercent(display);
      break;
    case "compact":
      formatted = formatCompact(Math.round(display));
      break;
    default:
      formatted = formatNumber(Math.round(display));
  }

  return (
    <span className={cn("font-mono tabular-nums", className)}>{formatted}</span>
  );
}
