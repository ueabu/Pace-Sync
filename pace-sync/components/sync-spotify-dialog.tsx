"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  syncNewPlaylist,
  syncReplacePlaylist,
} from "@/app/actions/sync";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SyncMode = "new" | "replace";

export function SyncSpotifyDialog({
  trigger,
  sourcePlaylistId,
  sourcePlaylistName,
  trackUris,
}: {
  trigger: React.ReactNode;
  sourcePlaylistId: string;
  sourcePlaylistName: string;
  trackUris: string[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SyncMode>(() =>
    sourcePlaylistId ? "replace" : "new",
  );
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  const trackCount = trackUris.length;

  const preview = useMemo(() => {
    const noun = trackCount === 1 ? "track" : "tracks";
    if (mode === "replace" && sourcePlaylistName) {
      return `This will replace ${trackCount} ${noun} in “${sourcePlaylistName}” with your new arrangement.`;
    }
    if (mode === "new") {
      const label = newName.trim() || "your playlist";
      return `This will create a new playlist named “${label}” with ${trackCount} ${noun}.`;
    }
    return `This will update ${trackCount} ${noun} in Spotify.`;
  }, [mode, newName, sourcePlaylistName, trackCount]);

  const canReplace = Boolean(sourcePlaylistId);
  const canSubmitNew = newName.trim().length > 0;
  const confirmDisabled =
    pending ||
    trackCount === 0 ||
    (mode === "new" && !canSubmitNew) ||
    (mode === "replace" && !canReplace);

  function onConfirm() {
    startTransition(async () => {
      if (mode === "new") {
        const res = await syncNewPlaylist(newName, trackUris);
        if (res.ok) {
          setOpen(false);
          toast.success(res.message, {
            description: (
              <a
                href={res.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent underline underline-offset-2"
              >
                Open in Spotify
              </a>
            ),
          });
        } else {
          toast.error(res.error);
        }
        return;
      }

      const res = await syncReplacePlaylist(sourcePlaylistId, trackUris);
      if (res.ok) {
        setOpen(false);
        toast.success(res.message, {
          description: (
            <a
              href={res.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline underline-offset-2"
            >
              Open in Spotify
            </a>
          ),
        });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync to Spotify</DialogTitle>
          <DialogDescription>
            Push your current arrangement to Spotify — same order as on this
            timeline (updates automatically when the editor ships).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              Destination
            </legend>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <input
                type="radio"
                name="sync-mode"
                className="mt-1 accent-accent"
                checked={mode === "replace"}
                disabled={!canReplace}
                onChange={() => setMode("replace")}
              />
              <span>
                <span className="font-medium text-foreground">
                  Replace imported playlist
                </span>
                <span className="mt-0.5 block text-black/60">
                  Overwrite tracks in the playlist you opened from.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <input
                type="radio"
                name="sync-mode"
                className="mt-1 accent-accent"
                checked={mode === "new"}
                onChange={() => setMode("new")}
              />
              <span>
                <span className="font-medium text-foreground">
                  Create a new playlist
                </span>
                <span className="mt-0.5 block text-black/60">
                  Keep the original as-is and publish a fresh list.
                </span>
              </span>
            </label>
          </fieldset>

          {mode === "new" ? (
            <div className="space-y-2">
              <Label htmlFor="new-playlist-name">Playlist name</Label>
              <Input
                id="new-playlist-name"
                placeholder="e.g. Marathon morning mix"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="rounded-md border border-black/10 bg-black/[0.03] px-3 py-3 text-sm leading-relaxed text-foreground">
            {preview}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" disabled={confirmDisabled} onClick={onConfirm}>
            {pending ? "Syncing…" : "Confirm sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
