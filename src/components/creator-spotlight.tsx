import { Link } from "@tanstack/react-router";
import { Award, UserRoundSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Spotlights require a server-verified creator prediction history. The current
 * app only exposes aggregate market and wallet data, so it cannot select or
 * preserve trustworthy winners yet.
 */
export function CreatorSpotlightSection() {
  return (
    <section
      aria-labelledby="creator-spotlight-heading"
      className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Award className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="creator-spotlight-heading" className="text-sm font-semibold">
            Creator spotlights
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Spotlights will appear when CloutChase can verify creators’ resolved prediction
            histories. The current market feed does not include that record, so there are no
            verified honorees yet.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
        <Link to="/leaderboard">
          <UserRoundSearch className="size-4" /> Browse market activity
        </Link>
      </Button>
    </section>
  );
}
