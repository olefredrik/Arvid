import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vilkår for bruk – Arvid",
  description: "Vilkår og ansvarsbegrensning for bruk av Arvid.",
  alternates: {
    canonical: "/vilkaar",
  },
};

// Vilkår for bruk – arvid.cloud
export default function Vilkaar() {
  const dataController = process.env.DATA_CONTROLLER ?? "[behandlingsansvarlig ikke konfigurert]";
  const contactEmail = process.env.CONTACT_EMAIL ?? "[e-post ikke konfigurert]";
  return (
    <main className="min-h-screen bg-orange-50 dark:bg-stone-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-10 inline-block">
          ← Tilbake
        </a>

        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">Vilkår for bruk</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-12">Sist oppdatert: mars 2026</p>

        <div className="space-y-10 text-stone-700 dark:text-stone-300">

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Aksept av vilkår</h2>
            <p className="text-sm leading-relaxed">
              Ved å bruke Arvid aksepterer du disse vilkårene. Hvis du ikke aksepterer dem, ber vi deg om å ikke bruke tjenesten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Hva Arvid er</h2>
            <p className="text-sm leading-relaxed">
              Arvid er et gratis verktøy som bruker kunstig intelligens til å lese, strukturere og sammenligne forsikringsdokumenter.
              Formålet er å gi deg bedre oversikt over egne forsikringer og hjelpe deg med å vurdere tilbud fra andre selskaper.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Arvid er ikke en forsikringsrådgiver, megler eller finansiell rådgiver. Tjenesten er nøytral og har ingen kommersielle bindinger til forsikringsbransjen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Ansvarsbegrensning</h2>
            <p className="text-sm leading-relaxed">
              Arvid bruker kunstig intelligens til å tolke innholdet i forsikringsdokumentene du laster opp. Denne tolkningen kan inneholde feil, unøyaktigheter eller mangler.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              Informasjonen Arvid produserer er veiledende og skal ikke alene ligge til grunn for beslutninger om bytte, oppsigelse eller tegning av forsikring.
              Du er selv ansvarlig for å lese og vurdere vilkårene i sin helhet før du tar beslutninger.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              {dataController} påtar seg ikke ansvar for tap eller skade som følge av beslutninger tatt på grunnlag av informasjon generert av Arvid.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Bruk av tjenesten</h2>
            <p className="text-sm leading-relaxed">
              Arvid er beregnet for personlig bruk av norske forbrukere. Tjenesten skal ikke brukes til kommersielle formål, videreformidling av analyser eller automatisert datainnhenting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Endringer i vilkårene</h2>
            <p className="text-sm leading-relaxed">
              Vi kan oppdatere disse vilkårene. Datoen øverst på siden viser når vilkårene sist ble endret.
              Fortsatt bruk av Arvid etter en endring innebærer aksept av de oppdaterte vilkårene.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Personvern</h2>
            <p className="text-sm leading-relaxed">
              Les om hvordan Arvid behandler data i{" "}
              <a href="/personvern" className="underline hover:text-stone-900 dark:hover:text-stone-100">
                personvernerklæringen
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Kontakt</h2>
            <p className="text-sm leading-relaxed">
              Spørsmål om vilkårene kan rettes til{" "}
              <a href={`mailto:${contactEmail}`} className="underline hover:text-stone-900 dark:hover:text-stone-100">
                {contactEmail}
              </a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
