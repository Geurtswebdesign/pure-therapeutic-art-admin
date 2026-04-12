export type CategoryStyle = {
  cardClass: string;
  orbClass: string;
  badge: string;
};

const CATEGORY_STYLE_BY_SLUG: Record<string, CategoryStyle> = {
  welkom: {
    cardClass: "bg-[#efe6dc]",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#fff6ea_0%,#f2d8bd_58%,#d7b089_100%)]",
    badge: "👋",
  },
  "rouw-verlies": {
    cardClass: "bg-[#e8e0ea]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f7f4fb_0%,#d9d0ea_58%,#b3a5d0_100%)]",
    badge: "🕊️",
  },
  gratis: {
    cardClass: "bg-teal-100",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#e7fffb_0%,#a7efe4_55%,#67d8c8_100%)]",
    badge: "🎁",
  },
  "cognitie-inzicht": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#2c0838_0%,#0e0818_62%,#07060f_100%)]",
    badge: "🧠",
  },
  "emoties-innerlijke-beleving": {
    cardClass: "bg-[#ead8e7]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f0dede_0%,#d8d8d8_55%,#c2c2c2_100%)]",
    badge: "❤️",
  },
  "gedrag-interactie": {
    cardClass: "bg-[#f2e3c8]",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#ffb01f_0%,#ef8b00_48%,#d76d00_100%)]",
    badge: "👥",
  },
  "lichaam-zintuigen": {
    cardClass: "bg-[#cddff0]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#28a6ff_0%,#0a86da_55%,#0471c2_100%)]",
    badge: "🧘",
  },
  "natuur-symboliek": {
    cardClass: "bg-[#cde8d2]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#cad6c9_0%,#aac2a9_50%,#8faa92_100%)]",
    badge: "🌿",
  },
  "zingeving-rituelen-spiritualiteit": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#5f9c62_0%,#2f6840_50%,#1f3f2c_100%)]",
    badge: "🪷",
  },
  "specifieke-doelgroepen-context": {
    cardClass: "bg-[#efe4b8]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#fafafa_0%,#ededed_52%,#d8d8d8_100%)]",
    badge: "🧑‍🤝‍🧑",
  },
  "symbolen-metaforen": {
    cardClass: "bg-[#e5dcf5]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f6f0ff_0%,#cdbce8_58%,#9e88c8_100%)]",
    badge: "🔮",
  },
  "veiligheid-privacy": {
    cardClass: "bg-[#dbe4ec]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f6fbff_0%,#c6d7e6_58%,#8aa7c0_100%)]",
    badge: "🔒",
  },
};

export function getCategoryStyle(slug: string): CategoryStyle {
  return (
    CATEGORY_STYLE_BY_SLUG[slug] ?? {
      cardClass: "bg-[#e8e3ee]",
      orbClass: "bg-[radial-gradient(circle_at_35%_30%,#d7d7d7_0%,#bdbdbd_60%,#a0a0a0_100%)]",
      badge: "✨",
    }
  );
}
