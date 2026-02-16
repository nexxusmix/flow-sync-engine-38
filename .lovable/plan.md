

# Fix: Botoes de Salvar e Exportar PDF nao aparecem no Modo Foco

## Diagnostico

Os botoes "Salvar Plano" e "Exportar PDF" estao condicionados a `plan && !isLoading && !error`. Isso significa que so aparecem **depois** que o plano e gerado com sucesso. Se a geracao falhar (como vinha acontecendo com os erros de JSON truncado e 502), os botoes nunca aparecem.

Alem disso, mesmo quando o plano carrega, os botoes ficam no header fixo que pode nao ser visualmente claro.

## Correcoes

### 1. `TaskExecutionGuide.tsx` - Tornar botoes sempre visiveis quando o modal esta aberto

- Mover os botoes "Exportar PDF" e "Salvar Plano" para **dentro da area de conteudo**, logo abaixo dos blocos de execucao (nao mais no header)
- Assim ficam visiveis quando o usuario faz scroll ate o final
- Tambem manter uma versao no header para acesso rapido
- Adicionar um **footer fixo** no modal com os botoes de acao quando o plano esta carregado
- Garantir que o DropdownMenu do PDF tenha `z-index` alto o suficiente para funcionar dentro do modal (`z-[60]`)

### 2. Estrutura do modal refatorado

```text
+----------------------------------+
| [Brain] Modo Foco          [X]  |  <- header fixo
| [===== progress bar =====]      |
+----------------------------------+
|                                  |
|  [Bloco 1 - Deep Work]          |
|  [Pausa Curta]                   |  <- area scrollavel
|  [Bloco 2 - Shallow Work]       |
|  ...                             |
+----------------------------------+
| [Exportar PDF v] [Salvar Plano] |  <- footer fixo com botoes
+----------------------------------+
```

### 3. Detalhes tecnicos

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`

Mudancas especificas:
- Remover os botoes do bloco condicional no header (linhas 176-193)
- Criar um footer fixo (`shrink-0 border-t`) abaixo da area scrollavel
- O footer fica visivel sempre que `plan` existe, independente do scroll
- Adicionar `portal` ao DropdownMenuContent para evitar clipping: `<DropdownMenuContent className="z-[60]">`
- Manter progress bar no header

