import { getPage } from "@/lib/pages";
import ComingSoon from "@/components/ComingSoon";

export default async function PrivacyPage() {
  const page = await getPage("privacy");

  if (!page) {
    return (
      <ComingSoon
        title="Privacy policy"
        description="This page hasn't been written yet. An admin can add it from the admin dashboard."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.title}</h1>
      <div className="mt-6 whitespace-pre-line text-neutral-700 dark:text-neutral-300">
        {page.body}
      </div>
    </div>
  );
}
