import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMarketActions, useWallet } from "@/lib/web3/hooks";
import { CATEGORIES } from "@/lib/web3/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a market — CloutChase" },
      {
        name: "description",
        content:
          "Launch a 24–48 hour attention market on any post, creator or trend and earn 1% of every losing pool.",
      },
      { property: "og:title", content: "Create a market — CloutChase" },
      {
        property: "og:description",
        content: "Launch a 24–48 hour attention market and earn a cut of the losing pool.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

const DURATIONS = [24, 36, 48];

function CreatePage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { createMarket, status } = useMarketActions();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(0);
  const [threshold, setThreshold] = useState("100000");
  const [duration, setDuration] = useState(24);

  const busy = status === "pending" || status === "confirming";
  const thresholdValue = Number(threshold.replace(/[^0-9]/g, ""));
  const invalid =
    subject.trim().length === 0
      ? "Give the market a subject"
      : subject.length > 200
        ? "Subject must be under 200 characters"
        : !thresholdValue
          ? "Set an attention target above zero"
          : null;

  async function submit() {
    if (!wallet.isConnected) {
      await wallet.connect().catch(() => {});
      return;
    }
    if (invalid) return;
    try {
      await createMarket({
        subject: subject.trim(),
        category,
        threshold: BigInt(thresholdValue),
        durationHours: duration,
      });
      toast.success("Market created");
      void navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create market");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Create a market</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Markets run for 24–48 hours. Staking closes at 80% of the window, then the attention oracle
        publishes the score and payouts settle automatically. You earn 1% of the losing pool.
      </p>

      <div className="panel mt-6 space-y-5 p-5">
        <div className="space-y-2">
          <Label htmlFor="subject">Post, creator or trend</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="@creator, post URL or #trend"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex gap-2">
            {CATEGORIES.map((label, index) => (
              <Button
                key={label}
                type="button"
                variant={category === index ? "default" : "secondary"}
                onClick={() => setCategory(index)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Attention target (engagements)</Label>
          <Input
            id="threshold"
            inputMode="numeric"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value.replace(/[^0-9]/g, ""))}
            className="numeric"
          />
          <p className="text-xs text-muted-foreground">
            YES wins if the oracle score reaches this number before the market resolves.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Window</Label>
          <div className="flex gap-2">
            {DURATIONS.map((hours) => (
              <Button
                key={hours}
                type="button"
                variant={duration === hours ? "default" : "secondary"}
                onClick={() => setDuration(hours)}
                className={cn("numeric")}
              >
                {hours}h
              </Button>
            ))}
          </div>
        </div>

        {invalid && <p className="text-sm text-destructive">{invalid}</p>}

        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={busy || Boolean(invalid)}
          onClick={() => void submit()}
        >
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
          {wallet.isConnected ? "Launch market" : "Connect wallet to launch"}
        </Button>
      </div>
    </div>
  );
}
