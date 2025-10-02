export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <section className="py-10 text-center">
        <h1 className="text-4xl font-bold text-primary-700">MyBazaar</h1>
        <p className="mt-3 text-gray-600">Student Marketplace for Northern Cyprus</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 h-32 animate-pulse" />
        ))}
      </section>
    </main>
  )
}
