import {
  Globe,
  Instagram,
  MessageCircle,
  Star,
  Linkedin,
  Facebook,
  Youtube,
  Twitter,
  Mail,
  Phone,
  Link2,
  type LucideIcon,
} from "lucide-react";

export type LinkKind =
  | "website"
  | "instagram"
  | "whatsapp"
  | "google_reviews"
  | "linkedin"
  | "facebook"
  | "youtube"
  | "x"
  | "email"
  | "phone"
  | "custom";

export interface LinkKindMeta {
  kind: LinkKind;
  label: string;
  defaultTitle: string;
  defaultSubtitle: string;
  icon: LucideIcon;
  /** Static class strings so Tailwind can see them at build time. */
  tile: string;
  placeholder: string;
}

export const LINK_KINDS: LinkKindMeta[] = [
  {
    kind: "website",
    label: "Website",
    defaultTitle: "Official Website",
    defaultSubtitle: "Visit our site",
    icon: Globe,
    tile: "bg-tile-neutral text-tile-neutral-foreground",
    placeholder: "https://example.com",
  },
  {
    kind: "instagram",
    label: "Instagram",
    defaultTitle: "Instagram",
    defaultSubtitle: "Follow our latest updates",
    icon: Instagram,
    tile: "bg-tile-instagram text-tile-instagram-foreground",
    placeholder: "https://instagram.com/yourhandle",
  },
  {
    kind: "whatsapp",
    label: "WhatsApp",
    defaultTitle: "WhatsApp",
    defaultSubtitle: "Message us directly",
    icon: MessageCircle,
    tile: "bg-tile-whatsapp text-tile-whatsapp-foreground",
    placeholder: "https://wa.me/919999999999",
  },
  {
    kind: "google_reviews",
    label: "Google Reviews",
    defaultTitle: "Google Reviews",
    defaultSubtitle: "Rate us on Google",
    icon: Star,
    tile: "bg-tile-google text-tile-google-foreground",
    placeholder: "https://g.page/r/...",
  },
  {
    kind: "linkedin",
    label: "LinkedIn",
    defaultTitle: "LinkedIn",
    defaultSubtitle: "Connect with us professionally",
    icon: Linkedin,
    tile: "bg-tile-linkedin text-tile-linkedin-foreground",
    placeholder: "https://linkedin.com/company/...",
  },
  {
    kind: "facebook",
    label: "Facebook",
    defaultTitle: "Facebook",
    defaultSubtitle: "Like our page",
    icon: Facebook,
    tile: "bg-tile-facebook text-tile-facebook-foreground",
    placeholder: "https://facebook.com/...",
  },
  {
    kind: "youtube",
    label: "YouTube",
    defaultTitle: "YouTube",
    defaultSubtitle: "Watch our videos",
    icon: Youtube,
    tile: "bg-tile-youtube text-tile-youtube-foreground",
    placeholder: "https://youtube.com/@...",
  },
  {
    kind: "x",
    label: "X",
    defaultTitle: "X",
    defaultSubtitle: "Follow us on X",
    icon: Twitter,
    tile: "bg-tile-x text-tile-x-foreground",
    placeholder: "https://x.com/yourhandle",
  },
  {
    kind: "email",
    label: "Email",
    defaultTitle: "Email Us",
    defaultSubtitle: "Send us a message",
    icon: Mail,
    tile: "bg-tile-neutral text-tile-neutral-foreground",
    placeholder: "mailto:hello@example.com",
  },
  {
    kind: "phone",
    label: "Phone",
    defaultTitle: "Call Us",
    defaultSubtitle: "Talk to our team",
    icon: Phone,
    tile: "bg-tile-whatsapp text-tile-whatsapp-foreground",
    placeholder: "tel:+919999999999",
  },
  {
    kind: "custom",
    label: "Custom link",
    defaultTitle: "Custom Link",
    defaultSubtitle: "",
    icon: Link2,
    tile: "bg-tile-neutral text-tile-neutral-foreground",
    placeholder: "https://…",
  },
];

const FALLBACK = LINK_KINDS[LINK_KINDS.length - 1]!;

export function getLinkKind(kind: string): LinkKindMeta {
  return LINK_KINDS.find((k) => k.kind === kind) ?? FALLBACK;
}

export const THEMES = [
  { value: "blue", label: "Royal blue", className: "lp-blue" },
  { value: "cream", label: "Cream & green", className: "lp-cream" },
  { value: "ink", label: "Ink & citron", className: "lp-ink" },
] as const;

export function themeClass(theme: string): string {
  return THEMES.find((t) => t.value === theme)?.className ?? "lp-blue";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
