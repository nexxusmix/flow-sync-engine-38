// Figma Community Templates Catalog
// Static catalog — no Figma API integration yet

export type TemplateCategory = 'social' | 'promo' | 'carousel' | 'poster' | 'quote' | 'event' | 'landing' | 'fashion';
export type TemplateAspect = '1:1' | '4:5' | '9:16' | '16:9';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'price' | 'url';
  placeholder?: string;
}

export interface FigmaTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  figma_url: string;
  aspect: TemplateAspect;
  preview_image_url: string | null;
  author: string;
  fields: TemplateField[];
  tags: string[];
}

const SOCIAL_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Título', type: 'text', placeholder: 'Título principal do post' },
  { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Subtítulo ou tagline' },
  { key: 'body', label: 'Corpo', type: 'textarea', placeholder: 'Texto do post' },
  { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Ex: Saiba mais' },
  { key: 'handle', label: 'Handle', type: 'text', placeholder: '@seuhandle' },
];

const PROMO_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Título', type: 'text', placeholder: 'Oferta ou promoção' },
  { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Detalhes da oferta' },
  { key: 'price', label: 'Preço', type: 'price', placeholder: 'R$ 99,90' },
  { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Compre agora' },
  { key: 'body', label: 'Descrição', type: 'textarea', placeholder: 'Descrição do produto/serviço' },
  { key: 'handle', label: 'Handle', type: 'text', placeholder: '@seuhandle' },
];

const CAROUSEL_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Título do Carousel', type: 'text', placeholder: 'Título principal' },
  { key: 'slides', label: 'Conteúdo dos Slides', type: 'textarea', placeholder: 'Um tópico por linha' },
  { key: 'cta', label: 'CTA Final', type: 'text', placeholder: 'Siga para mais' },
  { key: 'handle', label: 'Handle', type: 'text', placeholder: '@seuhandle' },
];

const EVENT_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Nome do Evento', type: 'text', placeholder: 'Nome do evento' },
  { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Tema ou slogan' },
  { key: 'date', label: 'Data', type: 'text', placeholder: 'DD/MM/AAAA' },
  { key: 'location', label: 'Local', type: 'text', placeholder: 'Local do evento' },
  { key: 'body', label: 'Descrição', type: 'textarea', placeholder: 'Detalhes do evento' },
  { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Inscreva-se' },
];

const POSTER_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Título', type: 'text', placeholder: 'Título principal' },
  { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Subtítulo ou tagline' },
  { key: 'body', label: 'Descrição', type: 'textarea', placeholder: 'Texto do poster' },
  { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Ação desejada' },
];

const LANDING_FIELDS: TemplateField[] = [
  { key: 'title', label: 'Headline', type: 'text', placeholder: 'Headline principal' },
  { key: 'subtitle', label: 'Sub-headline', type: 'text', placeholder: 'Sub-headline' },
  { key: 'body', label: 'Descrição', type: 'textarea', placeholder: 'Texto do hero' },
  { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Começar agora' },
  { key: 'features', label: 'Features', type: 'textarea', placeholder: 'Um benefício por linha' },
];

export const FIGMA_TEMPLATES: FigmaTemplate[] = [
  {
    id: 'instagram-bundle-45',
    name: 'Instagram Bundle Templates - 45+ Posts',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/892196882300261532',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Kamil Kalkan',
    fields: SOCIAL_FIELDS,
    tags: ['instagram', 'bundle', 'posts', 'multipurpose'],
  },
  {
    id: 'poster-3d-abstract',
    name: 'Poster Templates com Fundos 3D Abstratos',
    category: 'poster',
    figma_url: 'https://www.figma.com/community/file/1159272481268527242',
    aspect: '4:5',
    preview_image_url: null,
    author: 'Cláudia Silva',
    fields: POSTER_FIELDS,
    tags: ['poster', '3d', 'abstrato', 'dark'],
  },
  {
    id: 'social-media-kit-24',
    name: '24+ Social Media Templates Kit (Library Bundle)',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1329188757031069455',
    aspect: '1:1',
    preview_image_url: null,
    author: 'usevisuals',
    fields: SOCIAL_FIELDS,
    tags: ['instagram', 'linkedin', 'kit', 'moderno'],
  },
  {
    id: 'social-media-minimalist',
    name: 'Social Media Templates - Minimalist',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1327369423437270391',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: SOCIAL_FIELDS,
    tags: ['minimalista', 'clean', 'instagram'],
  },
  {
    id: 'promo-templates-bold',
    name: 'Promotional Post Templates - Bold',
    category: 'promo',
    figma_url: 'https://www.figma.com/community/file/1342527469859423830',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: PROMO_FIELDS,
    tags: ['promocional', 'oferta', 'bold'],
  },
  {
    id: 'carousel-instagram',
    name: 'Social Media Templates for Instagram Carousel',
    category: 'carousel',
    figma_url: 'https://www.figma.com/community/file/1360603444872820119',
    aspect: '1:1',
    preview_image_url: null,
    author: 'usevisuals',
    fields: CAROUSEL_FIELDS,
    tags: ['carousel', 'instagram', 'slides'],
  },
  {
    id: 'social-creative-pack',
    name: 'Creative Social Media Pack',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1275053085307695986',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: SOCIAL_FIELDS,
    tags: ['criativo', 'social', 'pack'],
  },
  {
    id: 'instagram-stories-kit',
    name: 'Instagram Stories & Posts Kit',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1063524664327399874',
    aspect: '9:16',
    preview_image_url: null,
    author: 'Community',
    fields: SOCIAL_FIELDS,
    tags: ['stories', 'instagram', 'vertical'],
  },
  {
    id: 'quote-post-templates',
    name: 'Quote Post Templates',
    category: 'quote',
    figma_url: 'https://www.figma.com/community/file/1344754348117588188',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: [
      { key: 'quote', label: 'Citação', type: 'textarea', placeholder: 'Texto da citação' },
      { key: 'author', label: 'Autor', type: 'text', placeholder: 'Nome do autor' },
      { key: 'handle', label: 'Handle', type: 'text', placeholder: '@seuhandle' },
    ],
    tags: ['citação', 'quote', 'inspiração'],
  },
  {
    id: 'event-poster-social',
    name: 'Event Poster for Social Media',
    category: 'event',
    figma_url: 'https://www.figma.com/community/file/1247216475323541365',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Muhammad Afin',
    fields: EVENT_FIELDS,
    tags: ['evento', 'poster', 'social'],
  },
  {
    id: 'carousel-inspiration',
    name: 'Inspiration Carousel Templates (Instagram & LinkedIn)',
    category: 'carousel',
    figma_url: 'https://www.figma.com/community/file/1467892306369161981',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: CAROUSEL_FIELDS,
    tags: ['carousel', 'inspiração', 'linkedin'],
  },
  {
    id: 'fashion-poster',
    name: 'Fashion Poster Templates',
    category: 'fashion',
    figma_url: 'https://www.figma.com/community/file/1338733952612658678',
    aspect: '4:5',
    preview_image_url: null,
    author: 'Community',
    fields: PROMO_FIELDS,
    tags: ['moda', 'fashion', 'poster'],
  },
  {
    id: 'instagram-sport-streetball',
    name: 'Instagram Posts Template - Sport / Streetball',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1108155950871061904',
    aspect: '1:1',
    preview_image_url: null,
    author: 'PataDesign',
    fields: SOCIAL_FIELDS,
    tags: ['esporte', 'sport', 'streetball', 'instagram'],
  },
  {
    id: 'statistics-infographics',
    name: 'Social Media Templates - Statistics & Infographics',
    category: 'carousel',
    figma_url: 'https://www.figma.com/community/file/1298321359327001773',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Título do infográfico' },
      { key: 'stats', label: 'Estatísticas', type: 'textarea', placeholder: 'Uma estatística por linha (ex: 85% - Dado X)' },
      { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Fonte dos dados' },
      { key: 'handle', label: 'Handle', type: 'text', placeholder: '@seuhandle' },
    ],
    tags: ['estatísticas', 'infográfico', 'dados'],
  },
  {
    id: 'social-media-general',
    name: 'Social Media Post Templates',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1275109864022431683',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: SOCIAL_FIELDS,
    tags: ['social', 'geral', 'posts'],
  },
  {
    id: 'social-modern-pack',
    name: 'Modern Social Media Templates Pack',
    category: 'social',
    figma_url: 'https://www.figma.com/community/file/1230604708032389430',
    aspect: '1:1',
    preview_image_url: null,
    author: 'Community',
    fields: SOCIAL_FIELDS,
    tags: ['moderno', 'social', 'pack'],
  },
  {
    id: 'landing-page-16',
    name: '16 Free Landing Page Designs',
    category: 'landing',
    figma_url: 'https://www.figma.com/community/file/1203891414567587586',
    aspect: '16:9',
    preview_image_url: null,
    author: 'Olabode Felix',
    fields: LANDING_FIELDS,
    tags: ['landing', 'page', 'web', 'hero'],
  },
  {
    id: 'real-estate-dark',
    name: 'Real Estate Business UI - Dark Theme',
    category: 'landing',
    figma_url: 'https://www.figma.com/community/file/1314076616839640516',
    aspect: '16:9',
    preview_image_url: null,
    author: 'Produce UI',
    fields: LANDING_FIELDS,
    tags: ['imobiliário', 'dark', 'business', 'web'],
  },
];

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  social: 'Social Media',
  promo: 'Promocional',
  carousel: 'Carousel',
  poster: 'Poster',
  quote: 'Citação',
  event: 'Evento',
  landing: 'Landing Page',
  fashion: 'Moda',
};

export const TEMPLATE_ASPECTS: Record<TemplateAspect, string> = {
  '1:1': 'Quadrado (1:1)',
  '4:5': 'Retrato (4:5)',
  '9:16': 'Stories (9:16)',
  '16:9': 'Paisagem (16:9)',
};
