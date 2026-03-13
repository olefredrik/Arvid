// Landingsside
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-24 text-center">
        <img src="/rolf.png" alt="Rolf" className="mx-auto mb-6 h-36 w-36 rounded-full object-cover" />
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">Rolf</h1>
        <p className="text-2xl font-medium text-gray-700 mb-4">
          Din nøytrale forsikringsrådgiver.
        </p>
        <p className="text-base text-gray-400 max-w-xl mx-auto mb-10">
          Last opp forsikringsavtalene dine som PDF. Rolf leser dem, lager en oversikt,
          og genererer en ferdig tilbudsforespørsel du kan sende til andre selskaper.
        </p>
        <a
          href="/analysis"
          className="inline-block bg-blue-600 text-white px-8 py-3.5 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors"
        >
          Last opp forsikringene dine
        </a>
        <div className="flex justify-center gap-6 mt-5 text-sm text-gray-500">
          <span>✓ Gratis</span>
          <span>✓ Ingen innlogging</span>
          <span>✓ Ingen lagring av dokumenter</span>
        </div>
      </section>

      {/* Slik fungerer det */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10 text-center">
            Slik fungerer det
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
            <div className="relative bg-white rounded-xl p-6 sm:rounded-r-none sm:border-r border-gray-100">
              <div className="text-2xl font-bold text-blue-600 mb-3">1</div>
              <h3 className="font-semibold text-gray-800 mb-2">Last opp avtaler</h3>
              <p className="text-sm text-gray-500">
                Last opp én eller flere forsikrings&shy;avtaler som PDF. Rolf identifiserer
                forsikringstype automatisk.
              </p>
            </div>
            <div className="relative bg-white rounded-xl p-6 sm:rounded-none sm:border-r border-gray-100">
              <div className="text-2xl font-bold text-blue-600 mb-3">2</div>
              <h3 className="font-semibold text-gray-800 mb-2">Få oversikt</h3>
              <p className="text-sm text-gray-500">
                Se dekningsnivå, egenandel og premie per forsikring samlet på ett sted –
                uten å lese vilkårene selv.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:rounded-l-none">
              <div className="text-2xl font-bold text-blue-600 mb-3">3</div>
              <h3 className="font-semibold text-gray-800 mb-2">Send tilbudsforespørsel</h3>
              <p className="text-sm text-gray-500">
                Rolf lager en ferdig kravspesifikasjon du kan sende til konkurrerende
                selskaper og be om tilbud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tillit */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10 text-center">
          Bygget på tillit
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Nøytral</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ingen kommersielle bindinger til forsikringsbransjen. Rolf er alltid på din side.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Ingen lagring</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Dokumentene dine prosesseres i sesjonen og kastes. Ingenting lagres i en database.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Åpen kildekode</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Koden er åpent tilgjengelig. Du kan verifisere selv at dokumentene ikke lagres.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6 flex justify-between items-center text-xs text-gray-400">
          <span>
            Rolf er et sideprosjekt utviklet av{" "}
            <a
              href="https://olefredrik.com"
              className="hover:text-gray-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ole Fredrik Lie
            </a>
          </span>
          <a
            href="https://github.com/olefredrik/Rolf"
            className="flex items-center gap-1.5 hover:text-gray-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Kildekode på GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
