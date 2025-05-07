import { CoPlainText } from "jazz-tools";
import { DraftOrganization, Organization } from "../schema.ts";

export function OrganizationForm({
  organization,
  onSave,
}: {
  organization: Organization | DraftOrganization;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (organization.name) {
      return organization.name.applyDiff(e.target.value);
    }

    organization.name = CoPlainText.create(e.target.value, {
      owner: organization._owner,
    });
  };

  return (
    <form onSubmit={onSave} className="flex gap-3 items-center">
      <label className="flex-1">
        <span className="sr-only">Organization name</span>
        <input
          type="text"
          name="name"
          id="name"
          value={organization.name?.toString() || ""}
          placeholder="Enter organization name..."
          className="rounded-md shadow-sm dark:bg-transparent w-full"
          onChange={handleChange}
          required
        />
      </label>
      {onSave && (
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      )}
    </form>
  );
}
