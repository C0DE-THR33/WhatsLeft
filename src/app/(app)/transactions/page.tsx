// Full mockup: design/Transactions.dc.html
export default function TransactionsPage() {
  return (
    <main className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-extrabold">Transactions</h1>
      {/* TODO: fetch db.transaction.findMany grouped by date, with category filter chips */}
    </main>
  );
}
