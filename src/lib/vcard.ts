export interface VCardSocial {
  label: string;
  url: string;
}

export interface VCardData {
  fullName: string;
  org: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  note: string | null;
  socials: VCardSocial[];
}

export const EMPTY_VCARD: VCardData = {
  fullName: "",
  org: null,
  role: null,
  phone: null,
  email: null,
  website: null,
  address: null,
  note: null,
  socials: [],
};

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Builds a vCard 3.0 payload (widest phone support). */
export function buildVcf(v: VCardData): string {
  const name = v.fullName.trim() || v.org?.trim() || "Contact";
  const parts = name.split(/\s+/);
  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(parts[0] ?? name)};;;`,
    `FN:${esc(name)}`,
  ];
  if (v.org) lines.push(`ORG:${esc(v.org)}`);
  if (v.role) lines.push(`TITLE:${esc(v.role)}`);
  if (v.phone) lines.push(`TEL;TYPE=CELL,VOICE:${esc(v.phone)}`);
  if (v.email) lines.push(`EMAIL;TYPE=INTERNET,PREF:${esc(v.email)}`);
  if (v.website) lines.push(`URL:${esc(v.website)}`);
  if (v.address) lines.push(`ADR;TYPE=WORK:;;${esc(v.address)};;;;`);
  for (const social of v.socials) {
    if (!social.url.trim()) continue;
    lines.push(`X-SOCIALPROFILE;TYPE=${esc(social.label || "profile")}:${esc(social.url)}`);
    lines.push(`URL;TYPE=${esc(social.label || "profile")}:${esc(social.url)}`);
  }
  if (v.note) lines.push(`NOTE:${esc(v.note)}`);
  lines.push(`REV:${new Date().toISOString()}`, "END:VCARD");
  return lines.join("\r\n");
}

export function downloadVcf(v: VCardData, fileNameBase: string) {
  const blob = new Blob([buildVcf(v)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileNameBase || "contact"}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function parseVcard(value: unknown): VCardData | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const str = (key: string) => (typeof o[key] === "string" && o[key] ? (o[key] as string) : null);
  const fullName = typeof o["fullName"] === "string" ? o["fullName"] : "";
  const socialsRaw = Array.isArray(o["socials"]) ? (o["socials"] as unknown[]) : [];
  const socials: VCardSocial[] = socialsRaw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const s = item as Record<string, unknown>;
    if (typeof s["url"] !== "string" || !s["url"]) return [];
    return [{ label: typeof s["label"] === "string" ? s["label"] : "profile", url: s["url"] }];
  });
  if (!fullName && !str("org") && !str("phone") && !str("email")) return null;
  return {
    fullName,
    org: str("org"),
    role: str("role"),
    phone: str("phone"),
    email: str("email"),
    website: str("website"),
    address: str("address"),
    note: str("note"),
    socials,
  };
}
