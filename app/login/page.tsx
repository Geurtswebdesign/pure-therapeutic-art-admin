import { login } from "@/components/login/actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action={login}
        className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Inloggen</h1>

        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Wachtwoord</label>
          <input
            name="password"
            type="password"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Inloggen
        </button>
      </form>
    </div>
  );
}
