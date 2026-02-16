

# Fix: Erro ao exportar PDF do Modo Foco

## Causa raiz

A Edge Function `export-focus-pdf` usa o caractere `○` (U+25CB, circulo branco) para marcar tarefas. A fonte `Helvetica` do pdf-lib so suporta caracteres WinAnsi (Latin-1), e esse simbolo nao faz parte do conjunto. O erro exato nos logs:

```
WinAnsi cannot encode "○" (0x25cb)
```

## Correcao

**Arquivo:** `supabase/functions/export-focus-pdf/index.ts`

Substituir o caractere `○` por `-` (hifen) na linha que desenha o marcador de cada tarefa. O hifen e totalmente compativel com WinAnsi.

Linha atual:
```typescript
page.drawText('○', { x: MARGIN + 16, y: taskY, size: 8, font, color: DIM });
```

Corrigida:
```typescript
page.drawText('-', { x: MARGIN + 16, y: taskY, size: 8, font, color: DIM });
```

Tambem verificar a funcao `sanitize()` que ja remove caracteres fora do range Latin-1, mas o `○` esta hardcoded no codigo, nao vem de dados do usuario -- por isso o sanitize nao o captura.

Apenas 1 linha precisa mudar. Apos o deploy automatico, a exportacao de PDF do Modo Foco voltara a funcionar.

