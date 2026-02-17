// components/categories/CategoryTable.tsx

import { buildCategoryTree, Category } from "./CategoryTree";
import CategoryRow from "./CategoryRow";

type Props = {
  categories: Category[];
};

export default function CategoryTable({ categories }: Props) {
  const tree = buildCategoryTree(categories);

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Description</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">Count</th>
          </tr>
        </thead>

        <tbody>
          {tree.map((node) => (
            <CategoryRow
              key={node.id}
              node={node}
              depth={0}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
