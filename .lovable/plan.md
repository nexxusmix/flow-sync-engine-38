

# Plano: Substituir Vídeo da Landing Page

## Objetivo
Trocar o iframe do YouTube por um vídeo MP4 local com autoplay, loop e sem controles.

## Mudanças

### 1. Copiar arquivo de vídeo
- **Origem:** `user-uploads://Sequência_01_1.mp4`
- **Destino:** `public/videos/hero-demo.mp4`
- Usar pasta `public` porque vídeos grandes são melhor servidos diretamente

### 2. Atualizar LandingPage.tsx (linhas 77-91)

**De:**
```tsx
<iframe
  src="https://www.youtube.com/embed/_g9NrlfizbQ..."
  ...
/>
```

**Para:**
```tsx
<video
  src="/videos/hero-demo.mp4"
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover"
/>
```

**Nota:** `muted` é obrigatório para autoplay funcionar nos navegadores modernos.

## Resultado
- Vídeo toca automaticamente ao carregar a página
- Loop infinito
- Sem controles de player
- Experiência premium e fluida

