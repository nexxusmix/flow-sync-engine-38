

# Aumentar o tamanho geral da plataforma em 35%

## Problema atual

A plataforma usa `font-size: 87.5%` (14px base) no `html` e tamanhos de texto muito pequenos espalhados por 130+ arquivos (`text-[9px]`, `text-[10px]`, `text-[11px]`). Isso torna a leitura difícil e a interface "apertada".

## Estrategia

Alterar individualmente 2.695 ocorrencias de tamanho em 130 arquivos seria arriscado e lento. A abordagem mais segura e eficiente:

1. **Aumentar o `font-size` base do `html`** de `87.5%` (14px) para `118%` (~19px) -- isso escala automaticamente tudo que usa `rem`, `em` e unidades relativas.

2. **Aplicar `zoom: 1.35`** no container principal do conteudo (dentro do `DashboardLayout`, apos o sidebar) para escalar uniformemente todos os elementos fixos em pixels (`text-[11px]`, icones, paddings em `px`). O sidebar e header serao ajustados separadamente para manter a proporcao.

3. **Ajustar o sidebar** para acompanhar o novo tamanho -- aumentar a largura colapsada e expandida proporcionalmente.

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | `font-size: 87.5%` para `100%` (16px base, mais legivel) |
| `src/components/layout/DashboardLayout.tsx` | Aplicar `zoom: 1.2` no container `main` para escalar conteudo uniformemente |
| `src/components/layout/Sidebar.tsx` | Aumentar larguras de `w-14`/`w-56` para `w-[72px]`/`w-[280px]`, aumentar tamanhos de texto e icones |
| `src/components/layout/Header.tsx` | Aumentar altura e tamanhos de fonte |

## Detalhes tecnicos

- A combinacao de `font-size: 100%` (de 87.5%) ja da +14% de aumento em tudo que usa rem
- O `zoom: 1.2` no conteudo principal da +20% adicional nos elementos com tamanho fixo em px
- Resultado combinado: ~35% maior visualmente
- O `zoom` CSS e suportado em todos os browsers modernos e escala tudo (texto, bordas, espacamentos, icones) sem quebrar layouts
- O sidebar fica fora do zoom para manter posicao fixa correta

