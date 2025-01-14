"use client";

import { Event } from "@/app/schema";
import { useCoState } from "jazz-react";
import { ID } from "jazz-tools";

export default function EventPage({ params }: { params: { id: ID<Event> } }) {
  const { id } = params;
  const event = useCoState(Event, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">{event?.name}</h1>
      <p>{event?.description}</p>
      <p>{event?.location}</p>
      <p>{event?.date.toLocaleString()}</p>
    </div>
  );
}
