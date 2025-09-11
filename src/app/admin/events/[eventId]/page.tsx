import { redirect } from "next/navigation";

export default function OldEventDetailsPage({ params }: { params: { eventId: string } }) {
    redirect(`/events/${params.eventId}`);
}