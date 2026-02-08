import squadFilmLogo from "@/assets/squad-film-logo-full.png";

export function PoweredByFooter() {
  return (
    <footer className="w-full py-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
          powered by
        </span>
        <img 
          src={squadFilmLogo} 
          alt="SQUAD///FILM" 
          className="h-4 w-auto opacity-60"
        />
      </div>
    </footer>
  );
}
