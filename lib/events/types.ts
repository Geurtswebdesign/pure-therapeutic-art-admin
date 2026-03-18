export type EventOccurrence = { start: string; end?: string };

export type AppEvent = {
  id: number;              // ameliaEventId
  title: string;
  descriptionHtml: string;
  ameliaEventId: number;
  price: number;
  capacity: number | null;
  nextOccurrence: string | null;
  occurrenceCount: number;
  occurrences?: EventOccurrence[];
  bookingUrl: string;      // deep-link that auto-opens popup
  listUrl?: string;
  updatedAt: string | null;
};
