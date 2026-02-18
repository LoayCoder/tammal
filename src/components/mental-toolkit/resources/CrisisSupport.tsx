import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Search } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  region: string;
  phone: string;
  availability: string;
  note?: string;
}

const CONTACTS: Contact[] = [
  { id: "1", name: "Emergency Services", region: "global", phone: "911 / 999 / 112", availability: "24/7", note: "Use your country's local emergency number" },
  { id: "2", name: "Crisis Text Line", region: "us", phone: "741741", availability: "24/7", note: "Text HOME to 741741" },
  { id: "3", name: "Samaritans", region: "uk", phone: "116 123", availability: "24/7", note: "Free call, anytime" },
  { id: "4", name: "NAMI Helpline", region: "us", phone: "1-800-950-6264", availability: "Mon–Fri 10am–10pm ET", note: "National Alliance on Mental Illness" },
  { id: "5", name: "Befrienders Worldwide", region: "global", phone: "befrienders.org", availability: "Varies by country", note: "Find your local centre at befrienders.org" },
  { id: "6", name: "Tawasol", region: "middleEast", phone: "920033360", availability: "24/7", note: "Saudi Arabia mental health support" },
  { id: "7", name: "Shefaa", region: "middleEast", phone: "00966-11-2052222", availability: "24/7", note: "Psychiatric hospital support line" },
];

const REGION_KEYS = ["all", "global", "us", "uk", "middleEast"] as const;

const REGION_COLORS: Record<string, string> = {
  global: "#A9CCE3",
  us: "#A8C5A0",
  uk: "#C9B8E8",
  middleEast: "#FAD7A0",
};

export default function CrisisSupport() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const filtered = CONTACTS.filter((c) => {
    const matchesRegion = regionFilter === "all" || c.region === regionFilter;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Emergency Banner */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#fee2e2" }}>
        <span className="text-lg">🚨</span>
        <p className="text-sm font-medium" style={{ color: "#991b1b" }}>{t("mentalToolkit.crisis.banner")}</p>
      </div>

      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(254,202,202,0.2), rgba(250,248,245,0.8))" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🆘</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.crisis.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.crisis.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("mentalToolkit.crisis.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-background ps-9 pe-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Region Filters */}
        <div className="flex gap-2 flex-wrap">
          {REGION_KEYS.map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                regionFilter === region
                  ? "border-transparent text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
              style={regionFilter === region && region !== "all" ? { background: REGION_COLORS[region], color: "#4A3F6B" } : regionFilter === region ? { background: "#e5e7eb", color: "#374151" } : {}}
            >
              {t(`mentalToolkit.crisis.regions.${region}`)}
            </button>
          ))}
        </div>

        {/* Contacts */}
        <div className="space-y-3">
          {filtered.map((contact) => (
            <div key={contact.id} className="rounded-2xl border border-border bg-background p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{contact.name}</p>
                  {contact.note && <p className="text-xs text-muted-foreground mt-0.5">{contact.note}</p>}
                </div>
                <Badge className="text-xs rounded-full border-0 shrink-0 text-foreground" style={{ background: (REGION_COLORS[contact.region] || "#e5e7eb") + "80" }}>
                  {t(`mentalToolkit.crisis.regions.${contact.region}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-mono font-medium text-foreground">{contact.phone}</p>
                  <p className="text-xs text-muted-foreground">{contact.availability}</p>
                </div>
                {contact.phone.includes("-") || /^\d/.test(contact.phone) ? (
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                    <Button size="sm" className="rounded-xl gap-1.5" style={{ background: "#ef4444", color: "#fff" }}>
                      <Phone className="h-3 w-3" />
                      {t("mentalToolkit.crisis.callNow")}
                    </Button>
                  </a>
                ) : (
                  <a href={`https://${contact.phone}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs">Visit Site</Button>
                  </a>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No contacts found for your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
