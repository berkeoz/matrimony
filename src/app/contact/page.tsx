import { getPage } from "@/lib/pages";
import ContactForm from "@/components/ContactForm";

export default async function ContactPage() {
  const page = await getPage("contact");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {page?.title ?? "Contact us"}
      </h1>
      <div className="mt-3 whitespace-pre-line text-neutral-600 dark:text-neutral-400">
        {page?.body ?? "Have a question or feedback? Send us a message and we'll get back to you."}
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
