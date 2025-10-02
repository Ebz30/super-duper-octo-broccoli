export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-primary-700">Login</h1>
      <form className="space-y-4">
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" />
        <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" />
        <label className="flex items-center gap-2">
          <input type="checkbox" /> <span>Remember me</span>
        </label>
        <button className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded">Login</button>
      </form>
    </main>
  );
}
