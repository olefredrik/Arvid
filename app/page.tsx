// Landingsside
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Rolf</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Din nøytrale forsikringsrådgiver. Last opp avtalene dine og få en klar oversikt.
      </p>
      <a
        href="/analysis"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Start analyse
      </a>
    </main>
  );
}
