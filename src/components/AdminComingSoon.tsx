export default function AdminComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-neutral-500 dark:border-white/15">
        Coming soon.
      </div>
    </div>
  );
}
