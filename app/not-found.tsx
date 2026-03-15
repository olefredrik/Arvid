// 404-side – vises automatisk av Next.js når en rute ikke finnes
export default function NotFound() {
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-7xl font-bold text-amber-600 dark:text-amber-500 mb-8">404</p>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-3">
          Arvid har gått gjennom bunken to ganger. Ingen spor.
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-10">
          Dette er ikke dekket av noen forsikring han kjenner til.
        </p>
        <a
          href="/"
          className="inline-block bg-orange-600 dark:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
        >
          ← Tilbake til forsiden
        </a>
      </div>
    </main>
  );
}
