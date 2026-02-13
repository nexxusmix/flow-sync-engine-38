

# Perfil do Admin + Avatar Upload + Cores da Plataforma

## O que sera feito

### 1. Corrigir nome do admin para "Matheus Filipe"
O perfil atual mostra `full_name: "Matheus"`. Sera atualizado para `"Matheus Filipe"` diretamente no banco.

### 2. Upload de foto/avatar do perfil
Hoje nao existe nenhum bucket de storage nem UI para subir avatar. Sera criado:

- **Bucket `avatars`** (publico) no storage com policy de upload autenticado
- **Secao "Meu Perfil"** no Header (dropdown do usuario) ou uma pagina `/perfil` acessivel pelo clique no avatar
- UI com preview circular + botao de upload que salva no storage e atualiza `profiles.avatar_url`
- O avatar aparecera no Header ao lado do botao de logout (substituindo ou complementando o icone atual)

### 3. Personalizacao de cores da plataforma
A pagina de Branding (`/configuracoes/branding`) ja tem campos de `primary_color` e `accent_color` salvos no banco, mas eles nao afetam o CSS real da plataforma. Sera implementado:

- Um hook `useThemeColors` que le `branding_settings.primary_color` e `accent_color`
- Aplicacao dinamica das cores como CSS variables (`--primary`, `--ring`, etc.) no `:root`
- Preview em tempo real na pagina de Branding
- Presets rapidos (ex: Azul SQUAD, Roxo, Verde, Laranja) para facilitar

---

## Detalhes Tecnicos

### DB
- `UPDATE profiles SET full_name = 'Matheus Filipe' WHERE ...` (via insert tool)
- Migration: criar bucket `avatars` com RLS policy de upload para usuarios autenticados

### Arquivos a criar/editar

| Arquivo | Acao |
|---|---|
| `src/components/layout/UserAvatarMenu.tsx` | **NOVO** - Componente de avatar clicavel com dropdown (perfil, upload foto, sair) |
| `src/hooks/useThemeColors.ts` | **NOVO** - Hook que le cores do branding_settings e aplica como CSS vars |
| `src/components/layout/Header.tsx` | Substituir botao de logout por UserAvatarMenu + integrar useThemeColors |
| `src/pages/settings/BrandingSettingsPage.tsx` | Adicionar presets de cores e preview ao vivo |
| `src/App.tsx` | Integrar useThemeColors no nivel raiz |

### Fluxo de Upload de Avatar
1. Usuario clica no avatar no Header
2. Dropdown abre com opcao "Alterar foto"
3. Seleciona arquivo (imagem)
4. Upload para bucket `avatars/{userId}.webp`
5. URL publica salva em `profiles.avatar_url`
6. Avatar atualiza em tempo real no Header

### Fluxo de Cores
1. Admin vai em Configuracoes > Branding
2. Escolhe cor primaria (picker ou preset)
3. CSS variables atualizam em tempo real (preview)
4. Ao salvar, todas as sessoes carregam as novas cores do banco

