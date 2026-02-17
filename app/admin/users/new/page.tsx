import CreateUserForm from "./CreateUserForm";

export default function NewUserPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Gebruiker toevoegen</h1>
      <CreateUserForm />
    </div>
  );
}
