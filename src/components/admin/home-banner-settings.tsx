"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IntervalInput } from "@/components/admin/interval-input";
import { cn } from "@/lib/utils";
import { removeBannerImage, saveSettings, uploadBannerImages } from "@/server/actions/admin/store";

type Banner = {
  media: "video" | "images";
  height: "short" | "medium" | "full";
  images: { src: string; publicId: string | null; alt: string }[];
  slideIntervalSeconds: number;
  autoplayOnPhones: boolean;
};
type Slider = { autoSlide: boolean; intervalSeconds: number; autoplayOnPhones: boolean };

const HEIGHTS = [
  { value: "medium", label: "Medium: 65% of the screen (recommended)" },
  { value: "short", label: "Short: 50% of the screen" },
  { value: "full", label: "Full screen" },
] as const;

function useSave<T extends Record<string, unknown>>(key: "homeBanner" | "productSlider", initial: T) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  /** For values already saved on the server (uploads/removals). */
  const update = (next: T) => setValue(next);
  const save = (next: T, message: string) =>
    start(async () => {
      const res = await saveSettings({ key, value: next });
      if (!res.ok) return void toast.error(res.error);
      setValue(next);
      toast.success(message);
    });
  return { value, save, update, pending };
}

/** Admin → Banners & pages: banner height, video or image slider, slider images and timing. */
export function HomeBannerSettings({ initial }: { initial: Banner }) {
  const { value: b, save, update, pending } = useSave("homeBanner", initial);
  const [uploading, setUploading] = useState(false);
  const busy = pending || uploading;

  const move = (i: number, dir: -1 | 1) => {
    const images = [...b.images];
    const [img] = images.splice(i, 1);
    images.splice(i + dir, 0, img!);
    save({ ...b, images }, "Order saved");
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Banner height</span>
          <select
            value={b.height}
            disabled={busy}
            onChange={(e) => save({ ...b, height: e.target.value as Banner["height"] }, "Banner height saved")}
            className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm"
          >
            {HEIGHTS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Banner shows</legend>
          <div className="flex gap-1 rounded-full border border-border bg-muted p-1" role="radiogroup" aria-label="Banner shows">
            {(["video", "images"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={b.media === m}
                disabled={busy}
                onClick={() => b.media !== m && save({ ...b, media: m }, m === "video" ? "Banner now shows the video" : "Banner now shows the image slider")}
                className={cn("flex-1 rounded-full px-4 py-2 text-sm font-medium", b.media === m ? "bg-inverse text-inverse-foreground" : "hover:bg-card")}
              >
                {m === "video" ? "Video" : "Image slider"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      {b.media === "images" && b.images.length === 0 && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Upload at least one image below. Until then, shoppers see the video.</p>
      )}
      <p className="-mt-3 text-xs text-muted-foreground">Height applies to the full-width banner (the video&apos;s &quot;Full-width background&quot; layout and the image slider).</p>

      <div className="grid gap-3 border-t border-border pt-5">
        <div>
          <h3 className="font-sans text-base font-semibold">Slider images</h3>
          <p className="text-sm text-muted-foreground">Up to 6 images; 3–4 work best. Use wide landscape photos (1920×1080 or larger). The headline appears over the left side.</p>
        </div>
        {b.images.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {b.images.map((img, i) => (
              <li key={img.src} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-video bg-muted">
                  <Image src={img.src} alt="" fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />
                  <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">{i + 1}</span>
                </div>
                <div className="grid gap-2 p-3">
                  <Input
                    defaultValue={img.alt}
                    maxLength={150}
                    placeholder="Describe the image (for screen readers)"
                    aria-label={`Description of image ${i + 1}`}
                    onBlur={(e) => {
                      const alt = e.target.value.trim();
                      if (alt !== img.alt) save({ ...b, images: b.images.map((x) => (x.src === img.src ? { ...x, alt } : x)) }, "Description saved");
                    }}
                  />
                  <div className="flex gap-1">
                    <IconButton label={`Move image ${i + 1} earlier`} disabled={busy || i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton label={`Move image ${i + 1} later`} disabled={busy || i === b.images.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Remove image ${i + 1}`}
                      disabled={busy}
                      className="ml-auto text-destructive hover:bg-destructive-soft"
                      onClick={async () => {
                        const res = await removeBannerImage({ src: img.src });
                        if (!res.ok) return void toast.error(res.error);
                        update({ ...b, images: res.data });
                        toast.success(res.message);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {b.images.length < 6 && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50 hover:border-foreground-soft">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span>{uploading ? "Uploading…" : `Add images (JPG, PNG or WebP, up to 5 MB each; ${6 - b.images.length} more allowed)`}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                if (!files.length) return;
                setUploading(true);
                const form = new FormData();
                for (const f of files) form.append("images", f);
                const res = await uploadBannerImages(form);
                setUploading(false);
                if (!res.ok) return void toast.error(res.error);
                update({ ...b, images: res.images });
                toast.success(res.message);
              }}
            />
          </label>
        )}
      </div>

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <IntervalInput label="Change image every" seconds={b.slideIntervalSeconds} disabled={busy} onSave={(s) => save({ ...b, slideIntervalSeconds: s }, "Banner timing saved")} />
        <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm">
          <span>
            <b className="block">Also change images automatically on phones</b>
            <span className="text-muted-foreground">Off is recommended: phone visitors swipe instead (they can&apos;t pause by hovering).</span>
          </span>
          <Switch checked={b.autoplayOnPhones} disabled={busy} onCheckedChange={(on) => save({ ...b, autoplayOnPhones: on }, "Saved")} aria-label="Also change banner images automatically on phones" />
        </label>
      </div>
    </div>
  );
}

/** Admin → Banners & pages: the "Bestselling honey" product slider. Timing is independent of the banner. */
export function ProductSliderSettings({ initial }: { initial: Slider }) {
  const { value: s, save, pending } = useSave("productSlider", initial);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm sm:col-span-2">
        <span>
          <b className="block">Slide automatically</b>
          <span className="text-muted-foreground">When off, shoppers move the row with the arrows or by swiping.</span>
        </span>
        <Switch checked={s.autoSlide} disabled={pending} onCheckedChange={(on) => save({ ...s, autoSlide: on }, on ? "Products will slide automatically" : "Automatic sliding turned off")} aria-label="Slide products automatically" />
      </label>
      <IntervalInput label="Slide products every" seconds={s.intervalSeconds} disabled={pending || !s.autoSlide} onSave={(sec) => save({ ...s, intervalSeconds: sec }, "Product slider timing saved")} />
      <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm">
        <span>
          <b className="block">Also slide automatically on phones</b>
          <span className="text-muted-foreground">Off is recommended: moving rows are easy to miss on a phone.</span>
        </span>
        <Switch checked={s.autoplayOnPhones} disabled={pending || !s.autoSlide} onCheckedChange={(on) => save({ ...s, autoplayOnPhones: on }, "Saved")} aria-label="Also slide products automatically on phones" />
      </label>
    </div>
  );
}

function IconButton({ label, className, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" aria-label={label} className={cn("grid size-9 place-items-center rounded-lg border border-border hover:bg-muted disabled:opacity-40", className)} {...props}>
      {children}
    </button>
  );
}
