import { getContentItems } from "@/lib/content/queries";
import "@/styles/globals.css";
import "@/styles/content.css";

export default async function ContentIndexPage() {
  await getContentItems();

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      <div>
        <p>Welkom op het dashboard. 
          Hier vindt u een overzicht van de laatste activiteiten en statistieken.
        </p>
      </div>
    </div>
  );
}
