// Shared content types for the API layer and screens. The app always reads
// real data from the backend and never falls back to mock data, so this file
// holds the type definitions only (no fixtures, no old-project values).

export type Module = {
  id: number;
  title: string;
  description: string;
  prerequisites: string;
  icon: string;
  image_url: string | null;
  background_color: string;
  order_index: number;
};

export type Lesson = {
  id: number;
  module_id: number;
  title: string;
  description: string;
  content: string;
  read_time: number;
  lesson_order: number;
};

export type AppContent = {
  welcome_title: string;
  welcome_description: string;
  motivation_text: string;
  motivation_quote: string;
  welcome_subtitle?: string | null;
  welcome_footer?: string | null;
  app_description?: string | null;
  terms_url?: string | null;
  privacy_url?: string | null;
  featured_module_id?: number | null;
  premium_title?: string | null;
  premium_description?: string | null;
  support_email?: string | null;
  contact_url?: string | null;
  help_content?: string | null;
};
