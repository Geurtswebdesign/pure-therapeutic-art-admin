export default function MaintenancePage() {
  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <section className="w-full max-w-xl rounded border bg-white p-8 text-center space-y-3">
        <h1 className="text-2xl font-semibold">Onderhoudsmodus actief</h1>
        <p className="text-sm text-gray-600">
          De app is tijdelijk in onderhoud. Probeer het later opnieuw.
        </p>
      </section>
    </main>
  );
}
