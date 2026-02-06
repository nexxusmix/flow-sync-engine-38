
# Plano: Transformar Landing Page com Efeitos Visuais Imersivos

## Visao Geral

Transformar a pagina inicial em uma experiencia visual cinematografica com animacoes fluidas, efeitos neon, gradientes dinamicos, particulas interativas e profundidade 3D.

## Melhorias Planejadas

### 1. Sistema de Particulas Interativo

Criar um componente canvas que renderiza particulas flutuantes que:
- Respondem ao movimento do mouse
- Tem brilho neon (cor primaria ciano)
- Conectam-se com linhas quando proximas
- Flutuam com animacao suave

```text
Particula ────── conexao ────── Particula
    │                               │
    │      movimento organico       │
    ▼                               ▼
  glow                            glow
```

### 2. Gradientes Animados no Fundo

Substituir os blobs estaticos por orbs com:
- Gradientes radiais animados
- Pulso de luz (breathing effect)
- Movimento orbital lento
- Cores: ciano primario, roxo, azul profundo

### 3. Efeitos Neon nos Elementos

- Titulo hero com text-shadow neon pulsante
- Botoes com border glow animado
- Cards com hover neon intenso
- Badge com efeito scanner/pulse

### 4. Animacoes de Entrada Avancadas

Usando Framer Motion:
- Texto hero com reveal letra por letra
- Stats com contagem animada (counter)
- Cards com entrada 3D (rotateX)
- Elementos com parallax no scroll

### 5. Efeito de Profundidade 3D

- Perspectiva no container principal
- Layers de fundo em diferentes Z-indexes
- Movimento parallax no mouse hover
- Video hero com efeito flutuante 3D

### 6. Elementos Visuais Adicionais

- Grid de linhas cyberpunk no fundo
- Barra de "scan line" animada
- Reflexo espelhado sutil no hero
- Aura de luz atras do video

## Estrutura dos Componentes

```text
LandingPage
├── ParticlesBackground (canvas)
├── AnimatedGradientOrbs
├── CyberpunkGrid
├── ScanLine
│
├── NavBar (glassmorphism + neon)
│
├── HeroSection
│   ├── AnimatedBadge (pulse scanner)
│   ├── NeonTitle (text reveal + glow)
│   ├── AnimatedStats (counter)
│   └── FloatingVideo (3D transform)
│
├── FeaturesSection
│   └── FeatureCard[] (3D hover + neon)
│
├── CTASection (parallax + glow)
│
└── Footer (fade gradient)
```

## Detalhes Tecnicos

### Particulas (Canvas)

```typescript
// Estrutura basica
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// Renderizacao com glow
ctx.shadowBlur = 15;
ctx.shadowColor = '#00A3D3';
ctx.fillStyle = 'rgba(0, 163, 211, opacity)';
ctx.arc(x, y, size, 0, Math.PI * 2);
```

### Gradientes Animados CSS

```css
.gradient-orb {
  background: radial-gradient(
    circle,
    rgba(0, 163, 211, 0.4) 0%,
    rgba(139, 92, 246, 0.2) 50%,
    transparent 70%
  );
  animation: pulse 4s ease-in-out infinite,
             orbit 20s linear infinite;
}
```

### Titulo Neon

```css
.neon-title {
  text-shadow:
    0 0 10px rgba(0, 163, 211, 0.5),
    0 0 20px rgba(0, 163, 211, 0.3),
    0 0 40px rgba(0, 163, 211, 0.2);
  animation: neonPulse 2s ease-in-out infinite;
}
```

### Grid Cyberpunk

```css
.cyber-grid {
  background-image:
    linear-gradient(rgba(0, 163, 211, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 163, 211, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}
```

## Animacoes Framer Motion

### Hero Title Reveal

```typescript
const titleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const letterVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -90 },
  visible: { opacity: 1, y: 0, rotateX: 0 }
};
```

### Parallax no Mouse

```typescript
const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

// Mouse parallax
const mouseX = useMotionValue(0);
const mouseY = useMotionValue(0);
const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);
```

### Counter Animado

```typescript
function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2 });
    return controls.stop;
  }, []);

  return <motion.span>{rounded}</motion.span>;
}
```

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/landing/ParticlesBackground.tsx` | Criar | Sistema de particulas canvas |
| `src/components/landing/AnimatedGradientOrbs.tsx` | Criar | Orbs de gradiente animados |
| `src/components/landing/CyberpunkGrid.tsx` | Criar | Grid de fundo estilo cyber |
| `src/components/landing/NeonTitle.tsx` | Criar | Titulo com efeito neon |
| `src/components/landing/AnimatedCounter.tsx` | Criar | Contador animado |
| `src/components/landing/FloatingCard.tsx` | Criar | Card com hover 3D |
| `src/pages/LandingPage.tsx` | Modificar | Integrar todos os efeitos |
| `src/index.css` | Modificar | Adicionar keyframes neon |

## Sequencia de Implementacao

1. Adicionar CSS keyframes para neon e gradientes
2. Criar componente ParticlesBackground
3. Criar componente AnimatedGradientOrbs
4. Criar componente CyberpunkGrid
5. Criar componentes de texto animado (NeonTitle, Counter)
6. Criar FloatingCard com efeitos 3D
7. Reescrever LandingPage integrando tudo
8. Testar performance e ajustar

## Preview do Resultado

A landing page tera:
- Particulas ciano flutuando e conectando-se
- Orbs de gradiente pulsando suavemente no fundo
- Grid cyberpunk sutil atravessando a tela
- Titulo aparecendo letra por letra com glow neon
- Numeros das stats contando de 0 ate o valor
- Video flutuando com perspectiva 3D
- Cards subindo e girando ao aparecer
- Hover com brilho neon intenso em tudo
- Linha de scan passando periodicamente
