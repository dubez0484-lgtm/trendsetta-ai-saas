import { TopBar } from "@/components/TopBar";
import { CardLink } from "@/components/ui/Card";

const LINKS = [
  { href: "/competitors", label: "Competitor Intel", desc: "Track AI creators, agencies and market gaps" },
  { href: "/weekly-review", label: "Weekly Review", desc: "Keep / Kill / Double Down / Test" },
  { href: "/leads", label: "Leads", desc: "Content-to-lead funnel" },
  { href: "/lead-magnets", label: "Lead Magnets", desc: "Assets attached to your CTAs" },
  { href: "/templates", label: "Templates", desc: "TikTok & LinkedIn content structures" },
];

export default function MorePage() {
  return (
    <>
      <TopBar title="More" />
      <div className="space-y-2 p-4">
        {LINKS.map((l) => (
          <CardLink key={l.href} href={l.href}>
            <p className="text-sm font-medium text-white">{l.label}</p>
            <p className="mt-1 text-xs text-white/50">{l.desc}</p>
          </CardLink>
        ))}
      </div>
    </>
  );
}
