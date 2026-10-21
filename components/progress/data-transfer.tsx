"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useProgressData } from "@/hooks/useProgressData";

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DataTransfer() {
  const { exportProgress, importProgress, resetProgress } = useProgressData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runImport = async (raw: string) => {
    const result = await importProgress(raw);
    if (!result.ok) {
      setError(result.error);
      toast.error("Import failed", { description: result.error });
      return;
    }
    setError(null);
    setPasted("");
    setImportOpen(false);
    toast.success("Progress imported", {
      description: `${result.cardsImported} card records restored${result.migratedFrom ? ` (upgraded from v${result.migratedFrom})` : ""}.`,
    });
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await runImport(await file.text());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your data</CardTitle>
        <CardDescription>
          Progress is saved in this browser. Export a JSON backup to move it to another device or keep it safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            downloadText(`valence-progress-${new Date().toISOString().slice(0, 10)}.json`, exportProgress());
            toast.success("Backup downloaded");
          }}
        >
          <Download data-icon="inline-start" /> Export JSON
        </Button>

        <Dialog
          open={importOpen}
          onOpenChange={(open) => {
            setImportOpen(open);
            setError(null);
          }}
        >
          <DialogTrigger render={<Button variant="outline" />}>
            <Upload data-icon="inline-start" /> Import
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Import progress</DialogTitle>
              <DialogDescription>
                Choose a Valence backup file or paste its contents. This replaces the progress currently in this browser.
              </DialogDescription>
            </DialogHeader>
            <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            <Button variant="secondary" onClick={() => fileInput.current?.click()}>
              Choose a file…
            </Button>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder='{"format": "valence-progress", …}'
              className="h-36 font-mono text-xs"
              aria-label="Backup JSON"
              aria-invalid={error !== null}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button disabled={!pasted.trim()} onClick={() => runImport(pasted)}>
                Import pasted JSON
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            <RotateCcw data-icon="inline-start" /> Reset progress
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
              <AlertDialogDescription>
                Every card&apos;s review history and all unlocked sections will be cleared. Export a backup first if you
                might want it back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={async () => {
                  await resetProgress();
                  toast.success("Progress reset. Section 1 is waiting for you.");
                }}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
