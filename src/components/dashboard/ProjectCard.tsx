import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectCardProps {
  title: string;
  client: string;
  status: string;
  image: string;
  date: string;
  index?: number;
}

export function ProjectCard({ title, client, status, image, date, index = 0 }: ProjectCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{ 
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      className="glass-card rounded-[2rem] overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-500"
    >
      <div className="relative aspect-video overflow-hidden">
        <motion.img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <motion.button 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-[0_0_40px_rgba(0,163,211,0.5)]"
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </motion.div>
        </motion.button>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <motion.span 
            className="badge-info"
            whileHover={{ scale: 1.05 }}
          >
            {status}
          </motion.span>
          <span className="text-[9px] text-muted-foreground font-normal uppercase tracking-wider">{date}</span>
        </div>
        <h3 className="text-lg font-normal text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-xs text-muted-foreground font-light">{client}</p>
      </div>
    </motion.div>
  );
}
