export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category?: string;
  tags?: string[];
  status: 'published' | 'draft';
  createdAt: any;
}

export interface Settings {
  siteTitle: string;
  logoUrl?: string;
  apiKey?: string;
  apiKey2?: string;
  adminPin?: string;
  contactEmail: string;
  footerText: string;
  heroTitle: string;
  heroSubtitle: string;
  profileName?: string;
  profileImageUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  order: number;
  category?: string;
  tags?: string[];
  createdAt: any;
}
