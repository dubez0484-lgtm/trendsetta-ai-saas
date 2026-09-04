import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { TIKTOK_TEMPLATES, LINKEDIN_TEMPLATES } from "@/lib/constants/templates";

export default function TemplatesPage() {
  return (
    <>
      <TopBar title="Content Templates" />
      <div className="space-y-6 p-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">TikTok</h2>
          <div className="space-y-2">
            {TIKTOK_TEMPLATES.map((t) => (
              <Card key={t.key}>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="mt-1 text-xs text-white/50">{t.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-white/30">
                  {t.fields.join(" · ")}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/60">LinkedIn</h2>
          <div className="space-y-2">
            {LINKEDIN_TEMPLATES.map((t) => (
              <Card key={t.key}>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="mt-1 text-xs text-white/50">{t.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-white/30">
                  {t.fields.join(" · ")}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Link href="/content/new" className="block text-center text-sm text-neon-400 hover:underline">
          Start new content from a template →
        </Link>
      </div>
    </>
  );
}
