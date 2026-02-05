import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState } from "react";

const services = [
  "Product Design", "UX Design", "UI Design", "Branding", "Webflow", "Framer", "Motion"
];

const experiences = [
  {
    type: "Freelance",
    role: "Senior Product Designer",
    company: "GreenLeaf Co",
    period: "2022 - Present",
  },
  {
    type: "UX/UI Designer",
    role: "Lead Designer",
    company: "UrbanFit Studio",
    period: "2020 - 2022",
  },
  {
    type: "Product Designer",
    role: "UI Specialist",
    company: "PixelCrafters",
    period: "2018 - 2020",
  },
];

const projects = [
  {
    category: "Brand Identity",
    title: "Fade Studio",
    description: "Building brands to drive results through compelling storytelling.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop",
  },
  {
    category: "Web Design",
    title: "Atom AI",
    description: "Future-proof automation partner for enterprise businesses.",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
  },
];

export default function ProjectsPage() {
  const [activeNav, setActiveNav] = useState("Projects");

  return (
    <DashboardLayout title="Projetos">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Navigation */}
        <header className="glass-card rounded-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-foreground font-semibold">Polo</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {["Services", "Projects", "Testimonials", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeNav === item
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          
          <button className="btn-action">
            Get for Free
          </button>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Profile & About */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-border">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Johan Beker</h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-sm text-muted-foreground">Available for work</span>
              </div>
              <button className="btn-primary w-full justify-center">
                Connect with me
              </button>
            </div>

            {/* About Card */}
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I'm Johan Beker, a dedicated Web Designer & Developer from the vibrant city of Berlin, Germany. I specialize in combining creative vision with seamless technical execution to craft exceptional digital experiences.
              </p>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Hero Title */}
            <div className="glass-card rounded-3xl p-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                UI/UX Interaction Designer Based in{" "}
                <span className="text-primary">Berlin.</span>
              </h1>
            </div>

            {/* Services & Experience Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Services */}
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="chip"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">Experience</h3>
                <div className="space-y-4">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary text-lg">work</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] uppercase tracking-widest text-primary font-bold">{exp.type}</span>
                          <span className="text-[9px] text-muted-foreground">{exp.role}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">{exp.period}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-3xl overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-bold">{project.category}</span>
                    <h4 className="text-xl font-bold text-foreground mt-1 mb-2">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-foreground font-semibold">Polo Template</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Polo. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Use</a>
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
}
