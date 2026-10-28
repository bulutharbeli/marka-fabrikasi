export type Tier = 'standard' | 'pro';

export interface BrandBrief {
  companyName: string;
  tagline: string;
  sector: string;
  logoType: string;
  style: string;
  palette: string;
}

export interface BrandConcept {
  headline: string;
  story: string;
  nameIdeas: string[];
  taglines: string[];
  keywords: string[];
  visualDirection: string;
}

export interface LogoResult {
  id: string;
  kind: 'ai' | 'vector' | 'local';
  url: string;
  dataUrl?: string;
  external?: boolean;
  prompt: string;
  providerId: string;
  providerLabel: string;
  model: string;
  badge?: string;
  createdAt: number;
  /** AI sonucu bu taslağın yerine geçer */
  draftId?: string;
  meta?: Record<string, unknown>;
}

export interface Mockup {
  id: string;
  scenarioId: string;
  label: string;
  url: string;
  dataUrl?: string;
  mode: 'ai' | 'instant';
  providerLabel?: string;
}

export interface ProviderStatus {
  id: string;
  label: string;
  badge: string;
  state: 'idle' | 'active' | 'cooldown' | 'down' | 'ready';
  detail?: string;
  lastUsed?: number;
  fails: number;
}

export interface Toast {
  id: string;
  kind: 'info' | 'success' | 'error' | 'warn';
  title: string;
  detail?: string;
}
