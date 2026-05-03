import type { Metadata } from "next";
import { TimelineEditor } from "@/components/timeline/TimelineEditor";

export const metadata: Metadata = {
  title: "Timeline · Pacelist",
  description:
    "Arrange your playlist on the race timeline with anchors and Spotify search.",
};

export default function TimelinePage() {
  return <TimelineEditor />;
}
