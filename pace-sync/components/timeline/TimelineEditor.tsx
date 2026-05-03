"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RaceDetailsBar } from "./RaceDetailsBar";
import { SortableTrackRow } from "./SortableTrackRow";
import { TimeAxis } from "./TimeAxis";
import { TrackSearchPanel } from "./TrackSearchPanel";
import {
  TimelineArrangementProvider,
  useTimelineArrangement,
} from "./timeline-arrangement-context";

function TimelineEditorSurface() {
  const { tracks, setTracks, timelineContentMinWidthPx } =
    useTimelineArrangement();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTracks((items) => {
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RaceDetailsBar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 lg:flex-row lg:items-start">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch]">
          <div
            className="space-y-3"
            style={{ minWidth: timelineContentMinWidthPx }}
          >
            <TimeAxis />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={tracks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tracks.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm leading-relaxed text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                    Search Spotify on the right to add tracks. Drag the handle
                    to reorder. Tap the map pin to lock a song to its current
                    start, or tap the grey lane to pin it to another moment in
                    the race.
                  </p>
                ) : (
                  tracks.map((track) => (
                    <SortableTrackRow key={track.id} track={track} />
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <TrackSearchPanel />
      </div>
    </div>
  );
}

export function TimelineEditor() {
  return (
    <TimelineArrangementProvider>
      <div className="flex min-h-screen flex-col bg-zinc-50 text-foreground dark:bg-black">
        <TimelineEditorSurface />
      </div>
    </TimelineArrangementProvider>
  );
}
