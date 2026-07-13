import { ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-0">
      <h1 className="text-2xl font-semibold mb-6">Transactions</h1>

      <div className="border rounded-3xl shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E7EEFE] dark:bg-[#1E3A8A] flex items-center justify-center">
          <ArrowLeftRight className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-medium">No transactions yet</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your shield, unshield, send, and mint activity will appear here.
        </p>
      </div>
    </div>
  );
}
