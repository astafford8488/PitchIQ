"use client";

import { HelpTrigger } from "@/components/ui/Tooltip";

export function DashboardHelp() {
  return (
    <HelpTrigger
      content="Sent: emails delivered. Open rate: how many opened the email. Reply rate: interested, declined, or booked. Follow-ups: automatic reminders sent. Booked: marked as booked."
    />
  );
}

export function TargetListHelp() {
  return (
    <HelpTrigger
      content="Podcasts you save here can be used to generate pitches. Add contact email on the podcast page so we can send and track replies."
    />
  );
}

export function MediaContactsHelp() {
  return (
    <HelpTrigger
      content="Add journalists or media contacts manually, then add them to your list. Generate pitches from Pitches → New using the Media contacts section."
    />
  );
}

export function PitchesListHelp() {
  return (
    <HelpTrigger
      content="Draft: not sent yet. Sent: delivered. Opened: they opened the email. Interested / Declined / Booked: update as you hear back. ✓ = opened, ↗ = clicked, ↻ = follow-ups sent."
    />
  );
}
