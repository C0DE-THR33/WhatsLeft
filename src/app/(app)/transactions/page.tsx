import { getCurrentUser } from "@/lib/auth";
import { getTransactionsData } from "@/lib/queries";
import { TransactionsList } from "@/components/transactions/TransactionsList";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const transactions = await getTransactionsData(user.id);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-fg">Transactions</h1>
      <TransactionsList transactions={transactions} />
    </div>
  );
}
