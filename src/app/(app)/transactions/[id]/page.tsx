import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTransactionDetail, getCategoriesForUser } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { CategorySource } from "@prisma/client";
import { TransactionCategoryEditor } from "@/components/transactions/TransactionCategoryEditor";

// How a category was decided, said plainly. Worth surfacing: after
// automatic categorization exists, "why is this Transport?" is a real
// question, and the answer being visible is what makes the automation
// trustworthy rather than spooky.
const SOURCE_LABEL: Record<CategorySource, string> = {
  [CategorySource.RULE]: "Matched automatically from the merchant name",
  [CategorySource.LLM]: "Suggested by Claude",
  [CategorySource.MANUAL]: "You set this",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const [transaction, categories] = await Promise.all([
    getTransactionDetail(user.id, id),
    getCategoriesForUser(user.id),
  ]);

  // Covers both "no such transaction" and "not yours" — the query is
  // scoped by ownership, so the two are indistinguishable from here, which
  // is the point: a wrong id must not reveal that someone else's row
  // exists.
  if (!transaction) notFound();

  const isCredit = transaction.direction === "CREDIT";
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(transaction.transactionDate);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <Link
        href="/transactions"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-muted"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        Transactions
      </Link>

      <section className="mb-5 rounded-card bg-accent-soft p-5 text-center shadow-card">
        <p className="mb-1 text-[13px] font-semibold text-accent-soft-fg">
          {transaction.merchantName ?? transaction.description}
        </p>
        <p
          className={`text-[34px] font-bold tracking-tight tnum ${
            isCredit ? "text-success-fg" : "text-fg"
          }`}
        >
          {isCredit ? "+" : "−"}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="mt-1 text-[13px] font-medium text-accent-soft-fg">{dateLabel}</p>
      </section>

      <TransactionCategoryEditor
        transactionId={transaction.id}
        category={transaction.category}
        categories={categories}
        sourceLabel={
          transaction.category && transaction.categorySource
            ? SOURCE_LABEL[transaction.categorySource]
            : null
        }
      />

      <section className="mb-5 overflow-hidden rounded-card bg-surface shadow-card">
        <Row label="Account">
          {transaction.account.isCash
            ? "Cash"
            : `${transaction.account.fipName} · ${transaction.account.maskedAccountNumber}`}
        </Row>
        <Row label="Type">{isCredit ? "Money in" : "Money out"}</Row>
        {transaction.mode ? <Row label="Mode">{transaction.mode}</Row> : null}
        {/* Only worth showing when it says something the merchant name
          * hasn't already — for a manual entry the two are identical. */}
        {transaction.description !== transaction.merchantName ? (
          <Row label="Narration">{transaction.description}</Row>
        ) : null}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
      <span className="shrink-0 text-[13px] font-medium text-fg-muted">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-semibold text-fg">
        {children}
      </span>
    </div>
  );
}
