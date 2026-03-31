import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}

export default function TypingText({ text, speed = 100, startDelay = 500, className = "" }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [index, text, speed, started]);

  return (
    <span className={className}>
      <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        {displayedText}
      </span>
      {started && index < text.length && <span className="animate-pulse text-white">|</span>}
    </span>
  );
}
