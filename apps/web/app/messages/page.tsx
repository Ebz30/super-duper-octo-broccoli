export default function MessagesPage() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <aside className="bg-gray-100 rounded h-96" />
        <section className="md:col-span-2 bg-gray-100 rounded h-96" />
      </div>
    </main>
  )
}
