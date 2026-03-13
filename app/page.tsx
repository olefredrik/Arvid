// Landingsside
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <img src="/rolf.png" alt="Rolf" className="mx-auto mb-6 h-36 w-36 rounded-full object-cover" />
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">Rolf</h1>
        <p className="text-xl text-gray-500 mb-3">
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
          Start analyse
        </a>
        <p className="text-xs text-gray-400 mt-4">Gratis · Ingen innlogging · Ingen lagring av dokumenter</p>
      </section>

      {/* Slik fungerer det */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8 text-center">
          Slik fungerer det
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-2xl font-bold text-blue-600 mb-3">1</div>
            <h3 className="font-semibold text-gray-800 mb-2">Last opp avtaler</h3>
            <p className="text-sm text-gray-500">
              Last opp én eller flere forsikrings&shy;avtaler som PDF. Rolf identifiserer
              forsikringstype automatisk.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-2xl font-bold text-blue-600 mb-3">2</div>
            <h3 className="font-semibold text-gray-800 mb-2">Få oversikt</h3>
            <p className="text-sm text-gray-500">
              Se dekningsnivå, egenandel og premie per forsikring samlet på ett sted –
              uten å lese vilkårene selv.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-2xl font-bold text-blue-600 mb-3">3</div>
            <h3 className="font-semibold text-gray-800 mb-2">Send tilbudsforespørsel</h3>
            <p className="text-sm text-gray-500">
              Rolf lager en ferdig kravspesifikasjon du kan sende til konkurrerende
              selskaper og be om tilbud.
            </p>
          </div>
        </div>
      </section>

      {/* Tillit */}
      <section className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12 grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
          <div>
            <p className="font-semibold text-gray-800 mb-1">Nøytral</p>
            <p className="text-sm text-gray-400">
              Ingen kommersielle bindinger til forsikringsbransjen. Rolf er alltid på din side.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Ingen lagring</p>
            <p className="text-sm text-gray-400">
              Dokumentene dine prosesseres i sesjonen og kastes. Ingenting lagres i en database.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Åpen kildekode</p>
            <p className="text-sm text-gray-400">
              Koden er åpent tilgjengelig. Du kan verifisere selv at dokumentene ikke lagres.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6 flex justify-between items-center text-xs text-gray-400">
          <span>Rolf – åpen kildekode, MIT-lisens</span>
          <a
            href="https://github.com/olefredrik/rolf"
            className="hover:text-gray-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
