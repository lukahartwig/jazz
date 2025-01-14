import { Event } from "@/app/schema";
import { startWorker } from "jazz-nodejs";
import { ID } from "jazz-tools";
import EventComponent from "./eventComponent";

export default async function EventPage({
  params,
}: { params: { id: ID<Event> } }) {
  await startWorker({
    accountID: process.env.JAZZ_WORKER_ID,
    accountSecret: process.env.JAZZ_WORKER_SECRET,
  });

  const { id } = params;
  const event = await Event.load(id, {});

  if (!event) {
    return <div>Event not found</div>;
  }

  return <EventComponent prefetchedEvent={event} />;
}
