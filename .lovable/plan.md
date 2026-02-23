
# Gerar Cliente, CRM Deal e Prospect a partir do Projeto com IA

Adicionar ao menu de acoes do projeto (ProjectActionsMenu) uma opcao "Gerar Cliente + CRM + Prospeccao" que, com um clique, usa IA para extrair e preencher automaticamente:

1. Um **contato** em `crm_contacts` (cliente)
2. Um **deal** em `crm_deals` (pipeline CRM) vinculado ao contato e projeto
3. Um **prospect** em `prospects` + **oportunidade** em `prospect_opportunities` vinculada ao projeto

Tudo de forma autonoma, sem formularios manuais.

---

## Fluxo do Usuario

1. No menu de acoes de qualquer projeto (tres pontinhos), aparece nova opcao: **"Gerar Cliente + Pipeline"** com icone de IA (Sparkles)
2. Ao clicar, o sistema:
   - Verifica se ja existe um contato com o mesmo nome/empresa do cliente do projeto
   - Se nao existe, cria automaticamente em `crm_contacts`
   - Cria um Deal em `crm_deals` no estagio "lead" vinculado ao contato e ao projeto
   - Cria um Prospect em `prospects` e uma Opportunity em `prospect_opportunities`
   - Usa IA para enriquecer dados: gerar notas, temperatura, score, tags e proxima acao
3. Toast de sucesso com resumo do que foi criado

---

## Detalhes tecnicos

### 1. Nova Edge Function: `generate-client-from-project`

**Arquivo:** `supabase/functions/generate-client-from-project/index.ts`

Recebe `{ project_id }` e executa:

1. Busca o projeto completo (name, client_name, brand_name, description, contract_value, template, start_date, due_date)
2. Verifica se ja existe contato com `name = client_name` em `crm_contacts` (evita duplicatas)
3. Se nao existe, insere novo contato com `name = client_name`, `company = brand_name || client_name`
4. Chama Lovable AI (Gemini Flash) com o contexto do projeto para gerar:
   - `temperature` (hot/warm/cold baseado no valor e contexto)
   - `score` (0-100)
   - `source` ("projeto_existente")
   - `next_action` (sugestao de proxima acao)
   - `next_action_at` (data sugerida)
   - `tags` para o contato
   - `notes` contextuais
   - Dados de prospect: `niche`, `priority`, `city`
5. Insere Deal em `crm_deals` com contact_id, project_id, stage_key='lead', value=contract_value
6. Insere Prospect em `prospects` com company_name=client_name, decision_maker_name inferido
7. Insere Opportunity em `prospect_opportunities` com prospect_id, linked_project_id, estimated_value
8. Retorna resumo de tudo que foi criado

Usa tool calling para extrair JSON estruturado da IA (conforme padrao do projeto).

### 2. Atualizar `ProjectActionsMenu.tsx`

Adicionar nova opcao no DropdownMenu entre "Auto Update IA" e o separador:

```
Gerar Cliente + Pipeline (icone Sparkles, cor primary)
```

Novo handler `handleGenerateClient` que:
- Mostra toast loading "Gerando cliente e pipeline com IA..."
- Invoca `generate-client-from-project` com `project_id`
- Invalida queries: `crm-contacts`, `crm-deals`, `prospects`
- Mostra toast de sucesso com resumo

### 3. Config.toml

Adicionar entrada para nova funcao:
```toml
[functions.generate-client-from-project]
verify_jwt = false
```

### Arquivos a criar
- `supabase/functions/generate-client-from-project/index.ts`

### Arquivos a editar
- `src/components/projects/ProjectActionsMenu.tsx` (nova opcao no menu)
- `supabase/config.toml` (registro da funcao -- automatico)

### Fluxo anti-duplicata
- Antes de criar contato, busca por `name ILIKE client_name` em `crm_contacts`
- Antes de criar prospect, busca por `company_name ILIKE client_name` em `prospects`
- Se ja existem, reutiliza os IDs existentes e so cria deal/opportunity
