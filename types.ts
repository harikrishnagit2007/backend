export interface Project {
  id: string;
  title: string;
  category: 'web-design' | 'web-dev' | 'mobile-apps' | 'game-dev';
  categoryLabel: string;
  image: string;
  link: string;
}

export interface ExperienceItem {
  id: string;
  date: string;
  role: string;
  company: string;
  description: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: 'Laptop' | 'Code' | 'Smartphone' | 'Cpu' | 'Apple' | 'Android' | 'Zap';
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
  image: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  email?: string;
  socials: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  image: string;
  date: string;
  author: string;
  category: string;
  commentsCount: number;
  text: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  payment: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface SiteData {
  hero: {
    introText: string;
    title: string;
    words: string[];
    description: string;
    hasProfilePhoto: boolean;
    buttonHireText: string;
    buttonContactText: string;
  };
  about: {
    title: string;
    subtitle: string;
    desc1: string;
    desc2: string;
    skills: { name: string; value: number }[];
    metrics: { label: string; value: string; description: string; icon: string }[];
    bioModalText1: string;
    bioModalText2: string;
    competencies: string[];
  };
  services: ServiceItem[];
  experiences: ExperienceItem[];
  projects: Project[];
  pricing: PricingPlan[];
  testimonials: TestimonialItem[];
  teamMembers: TeamMember[];
  contact: {
    location: string;
    email: string;
    phone: string;
  };
  footer: {
    brand: string;
    address: string;
    copyrightText: string;
    designCredit: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  navigation?: { id: string; label: string }[];
  brand?: {
    businessName: string;
    brandStyle: 'Modern' | 'Minimal' | 'Premium' | 'Futuristic' | 'Luxury' | 'Bold';
  };
  theme?: {
    themeMode: 'dark' | 'light' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    cardColor: string;
    navbarColor: string;
    footerColor: string;
    heroLayout: string;
    navbarStyle: string;
    footerLayout: string;
    buttonStyle: string;
    cardDesign: string;
    fontFamily: string;
    iconStyle: string;
    borderRadius: number;
    enableAnimations: boolean;
    spacingPadding: string;
    logoUrl: string;
    faviconUrl: string;
    accentColor: string;
    backgroundGradient: string;
  };
}

