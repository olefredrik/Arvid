"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

// Begge bilder er i DOM fra start – vi toggler synlighet for å unngå lastingsforsinkelse
export default function ArvidPortrait() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Tilfeldig intervall mellom 2 og 5 sekunder for naturtro blinking
    const scheduleNextBlink = () => {
      const delay = 1500 + Math.random() * 1500;
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          timeoutRef.current = scheduleNextBlink();
        }, 150);
      }, delay);
    };

    const timeoutRef = { current: scheduleNextBlink() };
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="relative mx-auto mb-6 w-36 h-36 sm:w-52 sm:h-52">
      <Image
        src="/arvid.png"
        alt="Arvid – Din nøytrale forsikringsassistent"
        width={208}
        height={208}
        className={`object-contain drop-shadow-lg w-36 h-36 sm:w-52 sm:h-52 ${isBlinking ? "opacity-0" : "opacity-100"}`}
        priority
      />
      <Image
        src="/arvid-blink.png"
        alt=""
        aria-hidden
        width={208}
        height={208}
        className={`object-contain drop-shadow-lg w-36 h-36 sm:w-52 sm:h-52 absolute top-0 left-0 ${isBlinking ? "opacity-100" : "opacity-0"}`}
        priority
      />
    </div>
  );
}
