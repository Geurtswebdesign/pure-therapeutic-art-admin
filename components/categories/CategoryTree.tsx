// components/categories/CategoryTree.tsx

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CategoryNode = Category & {
  children: CategoryNode[];
};

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // eerst nodes maken
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // daarna koppelen
  categories.forEach((cat) => {
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children.push(map.get(cat.id)!);
      }
    } else {
      roots.push(map.get(cat.id)!);
    }
  });

  return roots.sort((a, b) => a.sort_order - b.sort_order);
}
