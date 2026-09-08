import { getCurrentUser } from "@/lib/auth";
import { getTransactionsData, getCategoriesForUser } from "@/lib/queries";
import { TransactionsList } from "@/components/transactions/TransactionsList";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [transactions, categories] = await Promise.all([
    getTransactionsData(user.id),
    getCategoriesForUser(user.id),
  ]);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-6 text-xl font-semibold text-fg">Transactions</h1>
      <TransactionsList transactions={transactions} categories={categories} />
    </div>
  );
}
