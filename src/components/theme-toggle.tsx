import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Toggle visual theme"
          title={`Theme: ${theme} (${resolvedTheme})`}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="size-4 text-primary transition-transform" />
          ) : (
            <Sun className="size-4 text-primary transition-transform" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <Sun className="size-4 text-amber-500" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <Moon className="size-4 text-blue-400" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          <Monitor className="size-4 text-muted-foreground" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
