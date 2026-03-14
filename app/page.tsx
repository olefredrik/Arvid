import Image from "next/image";

// Landingsside
export default function Home() {
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-16 sm:pt-24 sm:pb-24 text-center">
        <Image src="/arvid.png" alt="Arvid – Din nøytrale forsikringsrådgiver" width={208} height={208} className="mx-auto mb-6 object-contain drop-shadow-lg w-36 h-36 sm:w-52 sm:h-52" priority />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4">Arvid</h1>
        <p className="text-xl sm:text-2xl font-medium text-stone-700 dark:text-stone-200 mb-4">
          Din nøytrale forsikringsrådgiver.
        </p>
        <p className="text-base text-stone-500 dark:text-stone-400 max-w-xl mx-auto mb-10">
          Last opp forsikringsavtalene dine som PDF. Arvid leser dem, lager en oversikt,
          og genererer en ferdig tilbudsforespørsel du kan sende til andre selskaper.
        </p>
        <a
          href="/analysis"
          className="inline-block bg-orange-600 dark:bg-orange-700 text-white px-8 py-3.5 rounded-lg font-medium text-base hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
        >
          Last opp forsikringene dine
        </a>
        <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
          Allerede mottatt tilbud?{" "}
          <a href="/analysis?mode=compare" className="text-orange-600 dark:text-orange-400 hover:underline">
            Sammenlign tilbud her
          </a>
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-sm text-stone-400 dark:text-stone-500">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Gratis
          </span>
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
            Ingen innlogging
          </span>
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Ingen lagring av dokumenter
          </span>
        </div>
      </section>

      {/* Slik fungerer det */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-10 text-center">
          Slik fungerer det
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-3">1</div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Last opp avtalene dine</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Last opp én eller flere forsikrings&shy;avtaler som PDF. Arvid identifiserer forsikringstype automatisk.
            </p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-3">2</div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Få oversikt</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Se dekningsnivå, egenandel og premie samlet på ett sted – uten å lese vilkårene selv.
            </p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-3">3</div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Send tilbudsforespørsel</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Arvid lager en ferdig kravspesifikasjon du sender til konkurrerende selskaper og ber om tilbud.
            </p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-3">4</div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Sammenlign og ta stilling</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Last opp tilbudene du har mottatt. Arvid sammenligner pris og vilkår og gir deg en tydelig anbefaling.
            </p>
          </div>
        </div>
      </section>

      {/* Tillit */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-10 text-center">
          Bygget på tillit
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-2">Nøytral</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Ingen kommersielle bindinger til forsikringsbransjen. Arvid er alltid på din side.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-2">Ingen lagring</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Dokumentene dine prosesseres i sesjonen og kastes. Ingenting lagres i en database.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-2">Åpen kildekode</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Koden er åpent tilgjengelig. Du kan verifisere selv at dokumentene ikke lagres.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <span>
            Arvid er et sideprosjekt utviklet av{" "}
            <a
              href="https://olefredrik.com"
              className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ole Fredrik Lie
            </a>
          </span>
          <a
            href="/personvern"
            className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Personvern
          </a>
          <a
            href="https://github.com/olefredrik/Arvid"
            className="flex items-center gap-1.5 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Åpen kildekode på GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
