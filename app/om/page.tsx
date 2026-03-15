import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om tjenesten – Arvid",
  description: "Bakgrunn, formål og ansvarsbegrensning for Arvid.",
  alternates: {
    canonical: "/om",
  },
};

// Om-side for arvid.cloud
export default function Om() {
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-10 inline-block">
          ← Tilbake
        </a>

        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-12">Om tjenesten</h1>

        <div className="space-y-10 text-stone-700 dark:text-stone-300">

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Bakgrunn</h2>
            <p className="text-sm leading-relaxed">
              Det finnes per i dag ikke et standardisert format for hvordan forsikringsselskaper skal presentere
              innhold, vilkår og priser. Hvert selskap gjør dette på sin måte.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Det gjør det utfordrende for forbrukere å få en god oversikt, og spesielt vanskelig å sammenligne
              tilbud på tvers av selskaper.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Det er bakgrunnen for at Arvid ble laget. Målet er å gjøre det enkelt for deg å finne ut om
              dekningen din er riktig, og om prisen du betaler er konkurransedyktig.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Støttede forsikringstyper</h2>
            <p className="text-sm leading-relaxed">
              Arvid støtter tingforsikringer som hus, hytte, innbo, bil og en rekke andre kjøretøy og
              fritidsobjekter. Se den fullstendige listen i opplastingsflyten.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Personforsikringer som livsforsikring, uføreforsikring, behandlingsforsikring og helseforsikring
              er bevisst ikke støttet. Disse dokumentene kan inneholde helseopplysninger og medisinsk historikk,
              som er særlige kategorier av personopplysninger med strengere krav under GDPR enn det Arvid er
              bygget for å håndtere.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Les mer om hvordan Arvid håndterer dokumentene dine i{" "}
              <a href="/personvern" className="underline hover:text-stone-900 dark:hover:text-stone-100">
                personvernerklæringen
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Ansvar og begrensninger</h2>
            <p className="text-sm leading-relaxed">
              Arvid bruker kunstig intelligens til å lese og strukturere forsikringsdokumentene dine. Verktøyet
              er ikke perfekt. Det kan ta feil, og det er ikke en erstatning for kvalifisert forsikringsrådgivning.
              Se alltid gjennom resultatene selv før du tar beslutninger basert på dem.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Du bruker Arvid på eget ansvar. Les{" "}
              <a href="/vilkaar" className="underline hover:text-stone-900 dark:hover:text-stone-100">
                vilkår for bruk
              </a>{" "}
              for fullstendig ansvarsbegrensning.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
