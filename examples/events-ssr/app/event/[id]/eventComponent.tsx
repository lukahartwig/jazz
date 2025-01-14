"use client";

import { Event } from "@/app/schema";
import { useHydratedCoState } from "jazz-react";
import { DeeplyLoaded } from "jazz-tools";

export default function EventComponent({
  prefetchedEvent,
}: { prefetchedEvent: DeeplyLoaded<Event, {}> }) {
  const event = useHydratedCoState(Event, {}, prefetchedEvent);

  return (
    <div>
      <h1 className="text-2xl font-bold">{event?.name}</h1>
      <p>{event?.description}</p>
      <p>{event?.location}</p>
      <p>{event?.date.toLocaleString()}</p>
    </div>
  );
}
