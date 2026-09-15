import { getPage } from "@/lib/pages";
import PageEditor from "@/components/admin/PageEditor";

const pages = [
  { slug: "about", label: "About", defaultTitle: "About Evlilik Yolu" },
  { slug: "privacy", label: "Privacy Policy", defaultTitle: "Privacy Policy" },
  { slug: "contact", label: "Contact (intro text above the form)", defaultTitle: "Contact us" },
];

export default async function AdminPagesPage() {
  const rows = await Promise.all(
    pages.map(async (p) => ({ ...p, page: await getPage(p.slug) }))
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Edit the content shown on the About, Privacy, and Contact pages.
      </p>

      <div className="mt-6 space-y-6">
        {rows.map((row) => (
          <PageEditor
            key={row.slug}
            slug={row.slug}
            label={row.label}
            initialTitle={row.page?.title ?? row.defaultTitle}
            initialBody={row.page?.body ?? ""}
          />
        ))}
      </div>
    </div>
  );
}
