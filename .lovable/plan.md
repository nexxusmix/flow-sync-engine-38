
## Extração Completa de Arquivos com IA + Galeria de Assets em Tempo Real

### O que será feito

O sistema atual já tem upload de documentos e extração de dados para criar projetos. O pedido expande isso para:

1. **Extração visual inteligente**: Para cada arquivo enviado (PDF, DOCX, imagens), a IA analisa visualmente o conteúdo e detecta automaticamente logos, identidade visual, escopos, contratos, assinaturas — recortando e salvando como assets individuais
2. **Galeria de assets em tempo real**: Uma nova aba "Galeria IA" no projeto que exibe todos os assets extraídos em grade, com atualização via Realtime
3. **Salvamento automático nos arquivos do projeto**: Cada imagem/asset extraído é salvo na pasta correta (logos → referências, contratos → contratos, etc.)
4. **Nova edge function `extract-visual-assets`**: Processa os arquivos enviados, usa Gemini Vision para identificar e descrever cada elemento visual, gera thumbnails e salva tudo em `project_assets` e `project_files`
5. **Integração no AIProjectModal**: Após a extração dos dados do projeto, automaticamente processa os arquivos para extrair assets visuais e os exibe em preview dentro do modal
6. **Upload multi-arquivo melhorado**: O modal aceita qualquer tipo de arquivo (não só PDF + imagem), processa cada um em paralelo

---

### Arquitetura do fluxo

```text
[Usuário sobe arquivos] → AIProjectModal
         │
         ├─ extract-project-from-document  (dados texto: nome, valor, datas...)
         │
         └─ extract-visual-assets (NOVA) ──── Gemini Vision analisa cada arquivo
                    │                         Detecta: logos, cores, assinaturas,
                    │                         tabelas, escopos, carimbos
                    │
                    ├─ Salva imagens em storage → project-files bucket
                    │   pasta: referencias/ para logos/identidade
                    │   pasta: contratos/  para assinaturas/selos
                    │
                    └─ Insere registros em project_assets (thumb_url, category, tags)
                               │
                               └─ Realtime notifica frontend → Galeria atualiza
```

---

### Mudanças técnicas

#### 1. Nova Edge Function: `extract-visual-assets`

**`supabase/functions/extract-visual-assets/index.ts`**

- Recebe: `project_id`, lista de arquivos em base64 (PDF e imagens)
- Para cada arquivo, envia ao Gemini 2.5 Flash com prompt específico para:
  - Detectar presença de logo/marca (recortar região)
  - Extrair paleta de cores predominante
  - Identificar tipo de documento (contrato, proposta, briefing, etc.)
  - Extrair imagens relevantes embutidas
- Para cada asset detectado:
  - Converte para blob e faz upload no bucket `project-files`
  - Insere em `project_assets` com `category`, `tags`, `ai_title`, `thumb_url`
- Retorna lista de assets salvos com seus IDs e URLs
- Registrado em `supabase/config.toml` com `verify_jwt = false`

#### 2. Nova aba "Galeria" no projeto

**`src/components/projects/detail/tabs/GalleryTab.tsx`** (novo componente)

- Usa `useProjectAssets(project.id)` já existente
- Layout em grade responsiva (2→3→4 colunas)
- Cada card mostra: thumbnail, título IA, categoria, tags
- Filtros rápidos: Todos | Logos | Identidade | Contratos | Referências
- Botão "Processar mais arquivos" que abre upload direto
- Realtime já está implementado no hook `useProjectAssets`

#### 3. Integração no AIProjectModal

**`src/components/projects/modals/AIProjectModal.tsx`** (modificado)

- Novo passo `'extracting_visuals'` após o passo `'processing'` existente
- Depois de extrair dados textuais, automaticamente chama `extract-visual-assets` com os mesmos arquivos
- Exibe preview dos assets detectados na tela de review com mini-galeria
- Nova aba "Visual" na tela de review mostrando logos e assets extraídos
- Ao criar o projeto, os assets já estão salvos e vinculados

#### 4. Integração na aba de arquivos existente

**`src/components/projects/detail/tabs/FilesTab.tsx`** (modificado)

- Novo botão "Extrair Assets com IA" que abre modal de upload
- Após upload, chama `extract-visual-assets` e mostra progresso
- Arquivos originais salvos na pasta correta + assets extraídos na galeria

#### 5. Registro no ProjectTabs

**`src/components/projects/detail/ProjectTabs.tsx`** (modificado)

- Adicionar aba "Galeria" entre "Arquivos" e outra aba relevante

---

### Detalhes do prompt Gemini para extração visual

O prompt instruirá o Gemini a retornar um JSON estruturado para cada arquivo:
```json
{
  "document_type": "contrato | proposta | briefing | referencia | identidade_visual",
  "assets_found": [
    {
      "type": "logo | assinatura | carimbo | foto | ilustracao | paleta | outro",
      "description": "Logo da empresa XYZ em fundo transparente",
      "location": "canto superior esquerdo",
      "confidence": 0.92,
      "suggested_folder": "referencias",
      "suggested_category": "reference | deliverable | contract | other",
      "tags": ["logo", "identidade", "marca"]
    }
  ],
  "color_palette": ["#003F7C", "#FF5A00", "#FFFFFF"],
  "brand_name": "Nome detectado",
  "has_signature": true,
  "has_legal_seal": false
}
```

Para imagens onde um logo ou elemento foi detectado, a edge function usará Gemini com `modalities: ["image"]` para gerar um recorte limpo do elemento.

---

### Ordem de implementação

1. Criar edge function `extract-visual-assets` e registrar no config.toml
2. Criar `GalleryTab.tsx` com grid de assets em tempo real
3. Integrar a nova aba em `ProjectTabs.tsx`
4. Modificar `AIProjectModal.tsx` para incluir extração visual após extração textual e mostrar preview
5. Adicionar botão "Extrair Assets com IA" no `FilesTab.tsx`

---

### Observações técnicas

- A extração visual é **não bloqueante** — o projeto é criado mesmo se a extração visual falhar
- O bucket `project-files` já existe e será reutilizado
- A tabela `project_assets` já existe com todos os campos necessários (`thumb_url`, `ai_tags`, `category`, `ai_title`, etc.)
- O hook `useProjectAssets` já tem Realtime configurado, então a galeria atualiza automaticamente
- Arquivos > 20MB serão ignorados na extração visual (limitação da API)
- PDFs com mais de 10 páginas terão apenas as 5 primeiras processadas visualmente
