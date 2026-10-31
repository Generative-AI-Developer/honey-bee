"use client";

import { useState, useTransition } from "react";
import { Film, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveSettings } from "@/server/actions/admin/store";

type HomeVideo = { enabled: boolean; src: string; poster: string; caption: string; speed: 0.25 | 0.5 | 0.75 | 1; layout: "full" | "combo" | "half" | "frame" };

const SPEEDS = [
  { value: 1, label: "Normal speed" },
  { value: 0.75, label: "0.75× (slightly slow)" },
  { value: 0.5, label: "0.5× slow motion" },
  { value: 0.25, label: "0.25× very slow" },
] as const;

const LAYOUTS = [
  { value: "full", label: "Full-width background video, headline on top (recommended)" },
  { value: "combo", label: "Full screen on phones, half the banner on computers" },
  { value: "half", label: "Half the banner (large block above the text on phones)" },
  { value: "frame", label: "Small framed video beside the text" },
] as const;

/** Grabs a frame ~1.5s in as the cover image, so the banner never shows a black box while loading. */
async function makePoster(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("unreadable"));
    });
    v.currentTime = Math.min(1.5, (v.duration || 2) / 2);
    await new Promise<void>((resolve) => (v.onseeked = () => resolve()));
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function upload(form: FormData, onProgress: (pct: number) => void): Promise<{ src: string; poster: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/home-video");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const body = JSON.parse(xhr.responseText || "{}") as { src?: string; poster?: string; error?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.src) resolve({ src: body.src, poster: body.poster ?? "" });
      else reject(new Error(body.error ?? "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

export function HomeVideoSettings({ initial }: { initial: HomeVideo }) {
  const [video, setVideo] = useState(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const save = (next: HomeVideo, message: string) =>
    start(async () => {
      const res = await saveSettings({ key: "homeVideo", value: next });
      if (!res.ok) return void toast.error(res.error);
      setVideo(next);
      toast.success(message);
    });

  const onFile = async (file: File) => {
    if (file.size > 60 * 1024 * 1024) return void toast.error("Videos must be 60 MB or smaller.");
    setProgress(0);
    try {
      const form = new FormData();
      form.set("video", file);
      const poster = await makePoster(file);
      if (poster) form.set("poster", new File([poster], "poster.jpg", { type: "image/jpeg" }));
      const stored = await upload(form, setProgress);
      save({ ...video, ...stored, enabled: true }, "New video is live on the home page");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {video.src ? (
          <video src={video.src} poster={video.poster || undefined} controls muted playsInline preload="metadata" className="aspect-[9/16] w-full object-cover" aria-label="Current home page video" />
        ) : (
          <div className="grid aspect-[9/16] place-items-center text-muted-foreground">
            <Film className="size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="grid content-start gap-4">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
          <span>
            <b className="block">Show video on the home page</b>
            <span className="text-muted-foreground">When off, the honey-jar illustration is shown instead.</span>
          </span>
          <Switch
            checked={video.enabled}
            disabled={pending || !video.src}
            onCheckedChange={(on) => save({ ...video, enabled: on }, on ? "Video shown on the home page" : "Video hidden from the home page")}
            aria-label="Show video on the home page"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Playback speed</span>
            <select
              value={video.speed}
              disabled={pending}
              onChange={(e) => save({ ...video, speed: Number(e.target.value) as HomeVideo["speed"] }, "Playback speed saved")}
              className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm"
            >
              {SPEEDS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Layout</span>
            <select
              value={video.layout}
              disabled={pending}
              onChange={(e) => save({ ...video, layout: e.target.value as HomeVideo["layout"] }, "Layout saved")}
              className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm"
            >
              {LAYOUTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <form
          className="grid gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save(video, "Caption saved");
          }}
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Caption (shown over the video)</span>
            <div className="flex gap-2">
              <Input value={video.caption} maxLength={120} onChange={(e) => setVideo({ ...video, caption: e.target.value })} placeholder="e.g. Straight from our honey shop" />
              <Button type="submit" variant="subtle" disabled={pending}>
                Save
              </Button>
            </div>
          </label>
        </form>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Replace video</span>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-foreground-soft focus-within:ring-3 focus-within:ring-ring/50">
            {progress != null ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
            <span>{progress != null ? `Uploading… ${progress}%` : "Choose an MP4 or WebM video (up to 60 MB). Portrait phone videos work best; keep it under a minute."}</span>
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="sr-only"
              disabled={progress != null || pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void onFile(f);
              }}
            />
          </label>
          {progress != null && (
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
