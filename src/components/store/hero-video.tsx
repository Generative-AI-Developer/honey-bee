"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Home page banner video. Starts muted and looping (browsers only allow silent autoplay), at the
 * configured speed (0.5 = slow motion). Visitors can turn the sound on or pause it. Visitors who prefer
 * reduced motion get the cover image and a play button instead. Pauses itself when scrolled out of view.
 *
 * variant "frame": portrait card with rounded border. variant "fill": covers its positioned parent
 * edge to edge (object-cover), used for the half-banner and phone full-screen layouts.
 */
export function HeroVideo({
  src,
  poster,
  caption,
  speed = 1,
  variant = "frame",
  controls = "bottom",
  showCaption = true,
  className,
}: {
  src: string;
  poster?: string;
  caption?: string;
  speed?: number;
  variant?: "frame" | "fill";
  /** "top-mobile": top-right on phones (clear of text overlaid at the bottom), bottom-right on computers */
  controls?: "bottom" | "top" | "top-mobile";
  /** "desktop": caption only on computers (phones show the headline over the video instead) */
  showCaption?: boolean | "desktop";
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const userPaused = useRef(false);

  // playbackRate resets when the source (re)loads, so apply it on every relevant event
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const apply = () => {
      video.defaultPlaybackRate = speed;
      video.playbackRate = speed;
    };
    apply();
    video.addEventListener("loadedmetadata", apply);
    video.addEventListener("play", apply);
    return () => {
      video.removeEventListener("loadedmetadata", apply);
      video.removeEventListener("play", apply);
    };
  }, [speed]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) userPaused.current = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !userPaused.current) video.play().catch(() => {});
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    }
  };

  const fill = variant === "fill";
  const button =
    "grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/70 focus-visible:outline-none";

  return (
    <figure className={cn(fill ? "absolute inset-0 overflow-hidden bg-chrome" : "relative overflow-hidden rounded-[28px] border-4 border-card bg-chrome shadow-card", className)}>
      <video
        ref={ref}
        src={src}
        poster={poster || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className={cn("block object-cover object-center", fill ? "absolute inset-0 size-full" : "aspect-[464/832] h-full w-full")}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={caption ? `Video: ${caption}` : "Video from our honey shop"}
      />
      {showCaption && caption && (
        <figcaption
          className={cn(
            "pointer-events-none absolute right-28 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-sm font-semibold text-white drop-shadow",
            fill && "lg:p-5",
            showCaption === "desktop" && "hidden lg:block",
          )}
        >
          {caption}
        </figcaption>
      )}
      <div
        className={cn(
          "absolute right-3 z-10 flex gap-2",
          controls === "top" && "top-3",
          controls === "bottom" && "bottom-3",
          controls === "top-mobile" && "top-3 lg:top-auto lg:bottom-5",
          fill && "lg:right-5",
          fill && controls === "bottom" && "lg:bottom-5",
        )}
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause video" : "Play video"} className={button}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted} className={button}>
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>
    </figure>
  );
}
