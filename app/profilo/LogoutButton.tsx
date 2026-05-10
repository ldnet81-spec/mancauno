export default function LogoutButton() {
  return (
    <form method="post" action="/api/auth/logout">
      <button
        type="submit"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-black"
      >
        Esci
      </button>
    </form>
  );
}
