
# Remover dados falsos da conta do Matheus

## Problema

Durante a migracao anterior, ao executar `UPDATE expenses SET created_by = matheus_id WHERE created_by IS NULL`, os 6 registros de despesas que eram do seed do Gabriel (Aluguel de lente, Adobe Creative Cloud, Editor freelancer, Uber, Boost Instagram, Seguro equipamento) foram erroneamente atribuidos ao Matheus.

## O que sera feito

Deletar as 6 expenses falsas da conta do Matheus. Os demais dados (4 revenues do Porto 153 e 16 content items) sao reais e serao mantidos.

### Registros a deletar

| Descricao | Valor | Categoria |
|-----------|-------|-----------|
| Aluguel de lente 24-70mm | R$ 350 | equipamento |
| Adobe Creative Cloud - Mensal | R$ 290 | software |
| Editor freelancer - Reels | R$ 1.500 | freelancer |
| Uber - Sessao fotografica | R$ 85 | transporte |
| Boost Instagram - Fevereiro | R$ 500 | marketing |
| Seguro equipamento | R$ 180 | other |

## Detalhes tecnicos

Executar um unico DELETE via SQL:

```sql
DELETE FROM expenses 
WHERE created_by = '5bdb380c-6d49-4f80-b42b-856484360bd5'
AND id IN (
  '5766ba48-9432-49d1-aede-a4fc34648b37',
  'f9c33f47-7d74-4879-be5d-7fba73c5b8f2',
  '53584653-30ad-4edf-8a03-9bf9051b0862',
  'e0f6f26c-2c59-4a9c-946f-2a406138a3c5',
  'cf468f62-5e06-44e1-96b4-e2b945bb5840',
  'd8ed5ee1-70a3-4489-9f41-da77531b1753'
);
```

Nenhuma alteracao de codigo e necessaria. Apenas limpeza de dados.
