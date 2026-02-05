
# Plano: Extração Hiper-Detalhada e Exibição Completa na Criação de Projeto com IA

## Problema Identificado

1. **Edge function funciona** - extraiu 5717 caracteres do PDF "PORTO 153 - Narrativa de Marca"
2. **Modal não exibe dados completos** - apenas campos básicos (título, cliente, valor)
3. **Escopo detalhado é perdido** - campo `scope` recebe resumo, não o texto completo
4. **Dados extras são ignorados** - deliverables, paymentMilestones, stageSchedule não são mostrados nem salvos

## Solução

### 1. Melhorar Extração na Edge Function

Atualizar o prompt para extrair TUDO do documento de forma extremamente detalhada:

```typescript
// Novo prompt para extração hiper-detalhada
const extractionPrompt = `Extraia ABSOLUTAMENTE TODO o conteúdo deste documento de forma EXTREMAMENTE DETALHADA.

ESTRUTURE A EXTRAÇÃO ASSIM:

## RESUMO EXECUTIVO
[Resumo do projeto em 2-3 parágrafos]

## ESCOPO COMPLETO
[Transcreva TODO o escopo palavra por palavra, incluindo:
- Objetivos do projeto
- Necessidades identificadas
- Abordagem proposta
- Metodologia
- Conceito criativo]

## ENTREGAS PREVISTAS
[Liste CADA entrega com formato, especificações técnicas, quantidade]

## CRONOGRAMA DETALHADO
[Cada etapa com datas e responsabilidades]

## CONDIÇÕES FINANCEIRAS
[Valor total, parcelas, gatilhos de pagamento, datas]

## CLÁUSULAS E OBSERVAÇÕES
[Revisões, restrições, requisitos especiais]

## DADOS DO CLIENTE
[Nome, empresa, contatos, CNPJ/CPF]

IMPORTANTE: Não resuma. Transcreva TUDO.`;
```

### 2. Expandir ExtractedData Interface

```typescript
interface ExtractedData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string; // CNPJ/CPF
  template: string;
  contractValue: number;
  startDate: string;
  deliveryDate: string;
  revisionLimit: number;
  
  // NOVOS CAMPOS DETALHADOS
  executiveSummary: string;     // Resumo executivo
  fullScope: string;            // Escopo completo (pode ser longo)
  deliverables: Array<{
    title: string;
    type: string;
    specifications?: string;
  }>;
  paymentMilestones: Array<{
    title: string;
    amount: number;
    percentage?: number;
    dueDate?: string;
    trigger?: string;
  }>;
  stageSchedule: Array<{
    stage: string;
    plannedStart?: string;
    plannedEnd?: string;
    durationDays?: number;
  }>;
  paymentTerms: string;
  additionalNotes: string;
  rawExtractedContent: string;  // Conteúdo bruto para referência
}
```

### 3. Redesenhar o Modal de Revisão

Nova estrutura com abas ou acordeão para mostrar TODOS os dados:

```text
┌──────────────────────────────────────────────────────────────┐
│  ✓ Dados Extraídos - Revise e ajuste                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Tab: Projeto] [Tab: Escopo] [Tab: Entregas] [Tab: Financeiro] │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ABA PROJETO:                                               │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ Nome do Projeto    │ │ Template           │             │
│  │ [Porto 153...]     │ │ [Filme Instit.]    │             │
│  └────────────────────┘ └────────────────────┘             │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ Cliente            │ │ Empresa            │             │
│  │ [João Silva]       │ │ [Porto S.A.]       │             │
│  └────────────────────┘ └────────────────────┘             │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ Data Início        │ │ Data Entrega       │             │
│  │ [2025-02-10]       │ │ [2025-03-15]       │             │
│  └────────────────────┘ └────────────────────┘             │
│                                                              │
│  ABA ESCOPO:                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Resumo Executivo                                       │ │
│  │ [Textarea readonly mostrando resumo]                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Escopo Completo (expandível)                    [▼]   │ │
│  │ [Todo o escopo extraído, editável]                    │ │
│  │ ...                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ABA ENTREGAS:                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ☑ Filme 4K (2-3 min) - video                          │ │
│  │ ☑ Making Of - video                                    │ │
│  │ ☑ 5 Fotos Still - imagem                               │ │
│  │ ☑ Versão Vertical - video                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ABA FINANCEIRO:                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Valor Total: R$ 45.000,00                              │ │
│  │                                                         │ │
│  │ Parcelas:                                               │ │
│  │ • 50% na assinatura - R$ 22.500 - 10/02/2025          │ │
│  │ • 30% na aprovação do roteiro - R$ 13.500 - 20/02     │ │
│  │ • 20% na entrega final - R$ 9.000 - 15/03/2025        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  [Voltar]                          [Cancelar] [Criar Projeto]│
└──────────────────────────────────────────────────────────────┘
```

### 4. Salvar Dados Completos

Ao criar o projeto:

```typescript
const handleSubmit = async () => {
  // 1. Criar projeto com escopo COMPLETO
  const project = await createProject({
    name: formData.title,
    client_name: clientName,
    description: buildCompleteDescription(), // Combina resumo + escopo + notas
    template: formData.template,
    start_date: formData.startDate,
    due_date: formData.deliveryDate,
    contract_value: formData.contractValue,
  });

  // 2. Criar etapas com datas do cronograma (se extraídas)
  if (formData.stageSchedule.length > 0) {
    await createStagesWithSchedule(project.id, formData.stageSchedule);
  }

  // 3. Salvar entregas no portal_deliverables (opcional)
  // 4. Criar evento no calendário para cada milestone
};

function buildCompleteDescription(): string {
  return `## RESUMO
${formData.executiveSummary}

## ESCOPO DETALHADO
${formData.fullScope}

## ENTREGAS
${formData.deliverables.map(d => `- ${d.title} (${d.type})`).join('\n')}

## CONDIÇÕES
- Limite de revisões: ${formData.revisionLimit}
- ${formData.paymentTerms}

## OBSERVAÇÕES
${formData.additionalNotes}`;
}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/extract-project-from-document/index.ts` | Prompt mais detalhado, retornar rawExtractedContent |
| `src/components/projects/modals/AIProjectModal.tsx` | Novo layout com abas, mostrar todos os dados |
| `src/hooks/useProjects.tsx` | Aceitar schedule e criar stages com datas |

## Fluxo Atualizado

1. **Upload** - Usuário envia PDF/imagens
2. **Extração** - IA extrai TUDO em formato estruturado + texto bruto
3. **Preview** - Modal mostra TODOS os dados em abas organizadas
4. **Edição** - Usuário pode ajustar qualquer campo
5. **Criação** - Projeto salvo com description completa, stages com datas

## Resultado Esperado

- Todo o conteúdo do documento preservado no campo `description`
- Resumo executivo visível rapidamente
- Escopo completo acessível (expandível)
- Entregas listadas e verificáveis
- Cronograma com datas das etapas
- Condições financeiras detalhadas
- Nada perdido da extração original
