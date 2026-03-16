"use client";

// Radio-knapp som spiller av bakgrunnsmusikk i Arvid-stil.
// Audio-instansen lever på modul-nivå for å overleve navigasjon mellom sider.
import { useState } from "react";
import { Volume2 } from "lucide-react";

let audio: HTMLAudioElement | null = null;
let audioPlaying = false;

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio("/arvid.mp3");
    audio.loop = true;
  }
  return audio;
}

export default function RadioPlayer() {
  const [playing, setPlaying] = useState(audioPlaying);

  const toggle = () => {
    const a = getAudio();
    if (!a) return;
    if (audioPlaying) {
      a.pause();
    } else {
      a.play();
    }
    audioPlaying = !audioPlaying;
    setPlaying(audioPlaying);
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Slå av musikk" : "Slå på musikk"}
      aria-pressed={playing}
      className="fixed top-4 right-14 p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
    >
      <Volume2
        className={`w-4 h-4 ${playing ? "text-amber-600 dark:text-amber-400" : "text-stone-600 dark:text-stone-300"}`}
        aria-hidden="true"
      />
    </button>
  );
}
