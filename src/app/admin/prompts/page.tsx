import { getAllPrompts } from "@/lib/prompts";
import PromptsManager from "@/components/admin/PromptsManager";

export default async function AdminPromptsPage() {
  const prompts = await getAllPrompts();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        The library members pick from on their profile — each member answers up to 3. Inactive
        prompts stay on existing profiles but can&apos;t be newly picked.
      </p>
      <PromptsManager prompts={prompts} />
    </div>
  );
}
