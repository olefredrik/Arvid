import Image from "next/image";

// 404-side – vises automatisk av Next.js når en rute ikke finnes
export default function NotFound() {
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <Image
          src="/arvid-404.png"
          alt="Arvid leter gjennom en bunke papirer"
          width={830}
          height={474}
          className="mx-auto mb-8 w-full max-w-sm sm:max-w-md"
          priority
        />
        <p className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-3">404 error</p>
        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">
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
