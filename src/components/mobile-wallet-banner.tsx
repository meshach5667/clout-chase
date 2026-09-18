import { useState, useEffect } from "react";
import { Smartphone, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMobileWithoutWallet, openMobileWalletModal } from "@/lib/web3/mobile-wallet";
import { useWallet } from "@/lib/web3/hooks";

const DISMISSED_KEY = "cloutchase.mobile_banner_dismissed";

export function MobileWalletBanner() {
  const wallet = useWallet();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wallet.isConnected) {
      setVisible(false);
      return;
    }
    const isDismissed = sessionStorage.getItem(DISMISSED_KEY) === "1";
    if (!isDismissed && isMobileWithoutWallet()) {
      setVisible(true);
    }
  }, [wallet.isConnected]);

  if (!visible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="border-b border-primary/30 bg-primary/10 px-4 py-2 text-xs md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Smartphone className="size-4 shrink-0 text-primary" />
          <span>Using mobile? Open in a wallet app (like MetaMask) to trade.</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="default"
            onClick={openMobileWalletModal}
            className="h-7 px-2.5 text-xs font-semibold gap-1"
          >
            Connect App <ExternalLink className="size-3" />
          </Button>
          <button
            onClick={handleDismiss}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss banner"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
