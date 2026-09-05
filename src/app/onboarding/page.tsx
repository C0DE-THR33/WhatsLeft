// Full mockup: design/Main.dc.html
export default function OnboardingPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-extrabold">SpendWise</h1>
      <p className="max-w-xs text-sm text-muted">
        Link your bank once. SpendWise reads every transaction automatically.
      </p>
      {/* TODO: port design/Main.dc.html — hero illustration + "Connect your bank" CTA to /connect-bank */}
    </main>
  );
}
