"use client";

import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitReview } from "@/server/actions/reviews";

export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Review {productName}</DialogTitle>
          <DialogDescription>Reviews are checked by our team before they appear.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await submitReview({ productId, rating, title: String(fd.get("title") ?? ""), body: String(fd.get("body") ?? "") });
              if (!res.ok) return setError(res.error);
              toast.success(res.message);
              setOpen(false);
            });
          }}
        >
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                >
                  <Star className={cn("size-8", (hover || rating) >= n ? "fill-rating text-rating" : "text-rating-empty")} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="review-title">Headline (optional)</Label>
            <Input id="review-title" name="title" maxLength={100} placeholder="e.g. Best sidr I've tasted" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="review-body">Your review</Label>
            <Textarea id="review-body" name="body" required minLength={10} maxLength={2000} rows={5} placeholder="Taste, texture, packaging, delivery…" />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Submit review
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
