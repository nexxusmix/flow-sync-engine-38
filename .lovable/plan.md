

## Análise: Login direto no Instagram

### Limitação importante

O Instagram **não oferece** uma API de login direto (username + senha). Todo acesso oficial à API do Instagram passa obrigatoriamente pela autenticação Meta/Facebook OAuth. A antiga "Instagram Basic Display API" foi descontinuada em dezembro de 2024.

As únicas opções oficiais são:
1. **Meta Graph API** (o que já está implementado) — requer Meta App
2. **Instagram oEmbed** — apenas para embed de posts públicos, sem métricas

Usar login direto com credenciais do Instagram (scraping) viola os Termos de Serviço e resulta em bloqueio de conta.

### Alternativas viáveis

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Manter Meta OAuth (atual) | Dados reais, oficial | Requer Meta App |
| Conexão manual (sem API) | Simples, sem Meta App | Sem dados automáticos |
| Scraping | Dados sem Meta App | Viola ToS, instável |

### Recomendação

Se não quer usar a Meta API, a melhor opção é **remover o fluxo OAuth** e trabalhar com **dados manuais**: o usuário insere username do Instagram e registra métricas manualmente (ou via snapshots periódicos). Isso já existe parcialmente no sistema com `instagram_profile_snapshots`.

Posso simplificar removendo toda a integração Meta e deixando apenas o campo de username + entrada manual de métricas?

