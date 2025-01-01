import { useAccount } from "./main.tsx";

export function Form() {
  const { me } = useAccount({ profile: {} });

  if (!me) return null;

  return (
    <form className="grid gap-4 border p-8">
      <div className="flex items-center gap-3">
        <label htmlFor="firstName">First name</label>
        <input
          className="border border-stone-300 rounded shadow-sm py-1 px-2 flex-1"
          type="text"
          id="firstName"
          value={me.profile.firstName}
          onChange={(e) => (me.profile.firstName = e.target.value)}
        />
      </div>
    </form>
  );
}
