

## Plano: Instagram Profile Preview Completo + Grid de Posts

### Problema Atual
O Cockpit mostra dados em cards genéricos sem identidade visual de perfil Instagram. Faltam: avatar/foto do perfil, bio visível, preview visual dos posts (publicados e agendados), e a experiência de "ver o perfil" como um todo.

### O que será implementado

**1. Card de Perfil Instagram (estilo Instagram real)**
- Avatar circular com upload de foto (usa bucket `avatars` existente + coluna `avatar_url` já existente na tabela `instagram_profile_config`)
- Handle, nome do perfil, bio, seguidores/seguindo/posts em layout tipo perfil Instagram
- Bio editável inline com botão de copiar
- Badges: nicho, sub-nicho, tom de voz

**2. Grid de Posts com Preview Visual**
- Grid 3 colunas estilo feed Instagram mostrando todos os posts
- Cada post mostra: ícone do formato (Reels/Carrossel/Foto/Story), título, badge de status colorido
- Posts publicados com link para `post_url` e embed thumbnail (via oEmbed se disponível)
- Posts agendados destacados com data/hora
- Posts em produção/prontos com indicador visual
- Click abre o `PostEditDialog` existente

**3. Seção "Próximos Agendados" (timeline visual)**
- Lista cronológica dos próximos posts agendados com countdown
- Formato, pilar e título visíveis
- Preview do hook/caption se disponível

**4. Funcionalidades antecipadas**
- Upload de avatar via drag & drop no card de perfil
- Contadores animados nos stats
- Link direto para o perfil real no Instagram
- Indicador visual de "dias sem postar" no avatar (borda vermelha/verde)

### Alterações técnicas

**Nenhuma migração necessária** — `avatar_url` já existe na tabela `instagram_profile_config`.

**Arquivo principal editado:**
- `src/components/instagram-engine/CockpitTab.tsx` — Refatorar para incluir:
  1. **ProfileCard**: Avatar uploadável + nome + handle + bio + stats (seguidores/seguindo/posts) em layout Instagram-like
  2. **PostsGrid**: Grid 3 colunas com todos os posts, ícones de formato, badges de status, e preview visual
  3. **ScheduledTimeline**: Próximos posts agendados em timeline com countdown
  4. Upload de avatar usa `supabase.storage.from('avatars').upload()` e salva URL no `avatar_url` do config

**Hook atualizado:**
- `src/hooks/useInstagramEngine.ts` — Adicionar `avatar_url` ao tipo `ProfileConfig` (já existe na tabela mas não no tipo TS)

**Componentes auxiliares (inline no CockpitTab):**
- `ProfileCard` — Card principal do perfil com avatar, bio, stats
- `PostsGrid` — Grid visual dos posts com status badges
- `ScheduledTimeline` — Próximos agendados

