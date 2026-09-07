import { getCurrentUserId } from "@/lib/auth";
import { getTransactions, getCategoryOptions } from "@/lib/queries";
import { TransactionsList } from "@/components/transactions/TransactionsList";

// Full mockup: design/Transactions.dc.html
export default async function TransactionsPage() {
  const userId = await getCurrentUserId();
  const [transactions, categories] = await Promise.all([
    getTransactions(userId),
    getCategoryOptions(userId),
  ]);

  return <TransactionsList initialTransactions={transactions} categories={categories} />;
}
