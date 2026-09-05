// Full mockup: design/BankConnect.dc.html
export default function ConnectBankPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-bold">Connect your bank</h1>
      <p className="max-w-xs text-sm text-muted">
        Redirects to Setu&apos;s hosted Account Aggregator consent screen.
      </p>
      {/* TODO: call POST /api/aa/consent, then redirect to result.redirectUrl */}
    </main>
  );
}
