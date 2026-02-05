

# Plano: Corrigir Logo Distorcido

## Problema
O logo na landing page está aparecendo esticado horizontalmente, perdendo sua proporção original.

## Solução
Adicionar a classe `object-contain` ao elemento `<img>` para garantir que o aspecto original seja preservado, e ajustar as constraints de tamanho.

## Mudanças

### `src/pages/LandingPage.tsx`

**Linha 21 (Logo do header):**
```tsx
// De:
<img src={squadLogo} alt="SQUAD Hub" className="h-10 w-auto" />

// Para:
<img src={squadLogo} alt="SQUAD Hub" className="h-10 max-h-10 object-contain" />
```

**Linha 147 (Logo do footer):**
```tsx
// De:
<img src={squadLogo} alt="SQUAD Hub" className="h-8 w-auto opacity-50" />

// Para:
<img src={squadLogo} alt="SQUAD Hub" className="h-8 max-h-8 object-contain opacity-50" />
```

## Explicacao Tecnica
- `object-contain`: garante que a imagem seja redimensionada mantendo aspect ratio
- `max-h-*`: limita altura maxima sem forcar esticamento
- Remove `w-auto` que pode causar comportamentos inesperados em alguns casos

