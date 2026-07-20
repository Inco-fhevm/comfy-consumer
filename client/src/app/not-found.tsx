import Link from "next/link";

export const metadata = { title: "Not Found" };

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 flex flex-col items-center text-center space-y-4">
      <h1 className="text-5xl font-semibold">404</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">Page not found.</p>
      <Link href="/" className="text-sm underline">
        Go home
      </Link>
    </main>
  );
}
