import "server-only";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

// Prerendered pages (home, product, category and content pages) are stored as whole pages.
// Expiring a data tag refreshes the cached queries, but the stored page copies must also be
// revalidated or shoppers keep seeing the old page. Use these after anything shoppers can see changes.

/** From Server Actions: expire the given data tags immediately and refresh every stored page. */
export function refreshStore(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
  revalidatePath("/", "layout");
}

/** From Route Handlers / background jobs (updateTag is Server-Action-only). */
export function refreshStoreInBackground(...tags: string[]) {
  for (const tag of new Set(tags)) revalidateTag(tag, "max");
  revalidatePath("/", "layout");
}
