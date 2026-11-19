import { useNavigate } from "react-router";
import { AppShell } from "../components/layout/AppShell";
import { ArrowRightIcon, Badge, Button, Card } from "../components/ui";
import { TEKS } from "../lib/teks";

export interface ModulSegeraPageProps {
  namaModul: string;
}

export function ModulSegeraPage({ namaModul }: ModulSegeraPageProps) {
  const navigate = useNavigate();

  return (
    <AppShell pageTitle={namaModul}>
      <Card variant="warm">
        <div style={{ marginBottom: "var(--space-3)" }}>
          <Badge variant="offline" label={namaModul} />
        </div>
        <h1
          style={{ fontSize: "var(--text-xl)", lineHeight: 1.25, marginBottom: "var(--space-2)" }}
        >
          {TEKS.modulSegeraJudul}
        </h1>
        <p className="tk-muted tk-prose">{TEKS.modulSegeraIsi}</p>
        <Button
          variant="secondary"
          iconEnd={<ArrowRightIcon size={18} />}
          onClick={() => {
            void navigate("/app");
          }}
        >
          {TEKS.kembaliKeBeranda}
        </Button>
      </Card>
    </AppShell>
  );
}
