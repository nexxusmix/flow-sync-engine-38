

## Problema

O Firecrawl **não suporta Instagram** (retorna 403 "we do not support this site"). Scraping automático do Instagram é bloqueado por todas as ferramentas disponíveis.

## Solução: Remover scraping e melhorar entrada manual

Em vez de tentar scraping que sempre falha, vou:

1. **Remover o botão/fluxo de scraping automático** do `InstagramMetaConnect.tsx` — elimina a mensagem de erro frustrante
2. **Melhorar o formulário manual** — campos editáveis para Seguidores, Seguindo, Posts com botão "Salvar Snapshot"
3. **Manter nota sobre Meta Graph API** — informar que coleta automática requer configuração do Meta App (META_APP_ID + META_APP_SECRET)

### Arquivos alterados
- `src/components/instagram-engine/InstagramMetaConnect.tsx` — remover chamada ao scraper, simplificar UI para entrada manual com campos numéricos limpos

### Resultado
- Sem mais mensagens de erro sobre coleta indisponível
- Interface limpa para registrar métricas manualmente
- Caminho claro para automação futura via Meta Graph API

