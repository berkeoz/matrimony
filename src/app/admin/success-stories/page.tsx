import { getSuccessStories } from "@/lib/success-stories";
import SuccessStoriesManager from "@/components/admin/SuccessStoriesManager";

export default async function AdminSuccessStoriesPage() {
  const stories = await getSuccessStories();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Success stories</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Shown on the homepage in the order below.
      </p>
      <SuccessStoriesManager stories={stories} />
    </div>
  );
}
