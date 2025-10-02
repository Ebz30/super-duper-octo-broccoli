export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Item #{params.id}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gray-100 h-64 rounded" />
        <aside className="space-y-3">
          <button className="w-full bg-primary-500 text-white px-4 py-2 rounded">Contact Seller</button>
          <button className="w-full border border-primary-500 text-primary-600 px-4 py-2 rounded">Favorite</button>
        </aside>
      </div>
    </main>
  );
}
