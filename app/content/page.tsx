import Link from "next/link";
import { getPublishedContent } from "@/lib/content/public-queries";

export default async function ContentIndexPage() {
  const items = await getPublishedContent();

  return (
    <div className="space-y-10">
      {items.map((item) => (
        <article key={item.id}>
          <h2 className="text-2xl font-semibold mb-2">
            <Link href={`/content/${item.slug}`}>
              {item.title}
            </Link>
          </h2>

          {item.excerpt && (
            <p className="text-gray-600">{item.excerpt}</p>
          )}
        </article>
      ))}
    </div>
  );
}
