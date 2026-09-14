import { getHomepageContent } from "@/lib/homepage-content";
import HomepageManager from "@/components/admin/HomepageManager";

export default async function AdminHomepagePage() {
  const content = await getHomepageContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Homepage content</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Edit the hero, how-it-works steps, trust & safety points, and closing call to action.
      </p>
      <HomepageManager content={content} />
    </div>
  );
}
