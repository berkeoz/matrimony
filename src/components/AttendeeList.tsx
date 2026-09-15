import Image from "next/image";
import type { AttendeeProfile } from "@/lib/rsvp";

export default function AttendeeList({ attendees }: { attendees: AttendeeProfile[] }) {
  if (attendees.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No one&apos;s confirmed yet — be the first to show up here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {attendees.map((attendee) => (
        <div key={attendee.userId} className="text-center">
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:bg-neutral-800">
            {attendee.photoUrl && (
              <Image src={attendee.photoUrl} alt="" fill sizes="150px" className="object-cover" />
            )}
          </div>
          <p className="mt-2 text-sm font-medium">
            {attendee.name}
            {attendee.age !== null && <span className="text-neutral-500">, {attendee.age}</span>}
          </p>
          {attendee.city && <p className="text-xs text-neutral-500">{attendee.city}</p>}
        </div>
      ))}
    </div>
  );
}
