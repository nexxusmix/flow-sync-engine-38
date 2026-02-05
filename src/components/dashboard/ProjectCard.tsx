import { Play } from "lucide-react";

interface ProjectCardProps {
  title: string;
  client: string;
  status: string;
  image: string;
  date: string;
}

export function ProjectCard({ title, client, status, image, date }: ProjectCardProps) {
  return (
    <div className="glass-card rounded-[2rem] overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-500">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-[0_0_40px_rgba(0,163,211,0.5)]">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </button>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge-info">{status}</span>
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{date}</span>
        </div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground font-medium">{client}</p>
      </div>
    </div>
  );
}
