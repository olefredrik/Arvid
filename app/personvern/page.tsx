// Personvernerklæring for arvid.cloud
export default function Personvern() {
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-10 inline-block">
          ← Tilbake
        </a>

        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">Personvernerklæring</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-12">Sist oppdatert: mars 2026</p>

        <div className="space-y-10 text-stone-700 dark:text-stone-300">

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Om Arvid</h2>
            <p className="text-sm leading-relaxed">
              Arvid er et gratis verktøy som hjelper norske forbrukere å forstå forsikringsavtalene sine.
              Arvid har ingen kommersielle bindinger til forsikringsbransjen og jobber alltid for brukeren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Forsikringsdokumenter</h2>
            <p className="text-sm leading-relaxed">
              Dokumenter du laster opp sendes til Anthropic Claude API for analyse og slettes umiddelbart etterpå.
              Ingenting lagres i en database. Arvid har ingen tilgang til dokumentinnholdet etter at sesjonen er avsluttet.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Anthropic er databehandler for innholdet i dokumentene under analysen.
              Se <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-900 dark:hover:text-stone-100">Anthropics personvernerklæring</a> for detaljer.
              Databehandleravtale med Anthropic er inngått før lansering.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Bruksstatistikk</h2>
            <p className="text-sm leading-relaxed">
              Arvid bruker anonymisert bruksstatistikk via PostHog (EU-infrastruktur, Ireland).
              Formålet er å forstå hvordan verktøyet brukes – for eksempel hvilke sider som besøkes.
            </p>
            <ul className="text-sm leading-relaxed mt-3 space-y-1 list-disc list-inside">
              <li>Ingen cookies lagres i nettleseren din</li>
              <li>Ingen personopplysninger samles inn</li>
              <li>IP-adresser anonymiseres</li>
              <li>Ingen kryssside-sporing</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Behandlingsgrunnlag: berettiget interesse (art. 6(1)(f) GDPR) – anonymisert statistikk uten personopplysninger.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Ingen lagring</h2>
            <p className="text-sm leading-relaxed">
              Arvid bruker ingen databaser, ingen brukerkontoer og ingen innlogging.
              Det finnes ingen personopplysninger å slette, korrigere eller eksportere.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Kontakt</h2>
            <p className="text-sm leading-relaxed">
              Spørsmål om personvern kan rettes til{" "}
              <a href="https://olefredrik.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-900 dark:hover:text-stone-100">
                Ole Fredrik Lie
              </a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
