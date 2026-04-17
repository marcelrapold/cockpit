/**
 * Phase 1: Legacy-Dashboard unter /index.html (statisch) im Vollbild-iframe.
 * Nächste Schritte: Komponenten nach und nach nach app/ und components/ migrieren.
 */
export default function Home() {
  return (
    <main className="flex h-[100svh] min-h-[100dvh] w-full flex-col bg-[#0b1120]">
      <iframe
        src="/index.html"
        title="Cockpit Dashboard"
        className="min-h-0 w-full flex-1 border-0"
      />
    </main>
  );
}
