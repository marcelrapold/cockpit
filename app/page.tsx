/**
 * Phase 1: Legacy-Dashboard unter /index.html (statisch) im Vollbild-iframe.
 * Nächste Schritte: Komponenten nach und nach nach app/ und components/ migrieren.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b1120]">
      <iframe
        src="/index.html"
        title="Cockpit Dashboard"
        className="h-[100dvh] w-full border-0"
      />
    </main>
  );
}
