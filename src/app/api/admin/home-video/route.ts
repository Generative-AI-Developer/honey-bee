import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { storeImage, storeVideo } from "@/services/storage";

// POST multipart: video (MP4/WebM ≤ 60 MB) + optional poster image (cover frame made in the browser).
// Admin only. Returns the stored URLs; the admin page then saves them with saveSettings("homeVideo"),
// which refreshes the home page for every visitor.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await rateLimit("video-upload", 10, 60 * 10, user.id);
    const form = await req.formData();
    const video = form.get("video");
    if (!(video instanceof File)) return NextResponse.json({ error: "Choose a video file." }, { status: 400 });
    const stored = await storeVideo(video);
    const poster = form.get("poster");
    const storedPoster = poster instanceof File && poster.size > 0 ? await storeImage(poster, "videos").catch(() => null) : null;
    return NextResponse.json({ src: stored.url, poster: storedPoster?.url ?? "" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
