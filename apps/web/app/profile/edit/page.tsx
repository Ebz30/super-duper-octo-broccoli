export default function EditProfilePage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Profile</h1>
      <form className="grid gap-3">
        <input className="border px-3 py-2 rounded" placeholder="Name" />
        <input className="border px-3 py-2 rounded" placeholder="University" />
        <input className="border px-3 py-2 rounded" placeholder="Phone" />
        <textarea className="border px-3 py-2 rounded" placeholder="Bio" />
        <button className="bg-primary-500 text-white px-4 py-2 rounded w-full">Save</button>
      </form>
    </main>
  )
}
