export type Taxonomy = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_hierarchical: boolean;
};

export type Term = {
  id: string;
  taxonomy_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  sort_order: number;
  is_active: boolean;
  content_term_relationships?: { count: number }[];
};

export type TermNode = Term & { children: TermNode[] };

export function buildTermTree(terms: Term[]): TermNode[] {
  const map = new Map<string, TermNode>();
  const roots: TermNode[] = [];

  terms.forEach(t => map.set(t.id, { ...t, children: [] }));

  terms.forEach(t => {
    const node = map.get(t.id)!;
    if (t.parent_id && map.has(t.parent_id)) {
      map.get(t.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: TermNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach(n => sortRec(n.children));
  };

  sortRec(roots);
  return roots;
}

export function flattenTree(nodes: TermNode[], depth = 0) {
  const out: { node: TermNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    out.push(...flattenTree(n.children, depth + 1));
  }
  return out;
}
