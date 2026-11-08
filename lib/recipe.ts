export type Ingredient = {
  name: string;
  original: string; // 元の表記「3個分」「大さじ1」
  grams: number | null; // グラム換算値
  estimated: boolean; // 換算が推定なら true
  group?: string | null; // 「A」「☆」などのグループ記号。グループなしは null
};

export type Recipe = {
  title: string;
  sourceUrl?: string; // サーバー側で付与
  yield?: { pan?: string; sizeCm?: number; servings?: string };
  ingredients: Ingredient[];
  prepTasks: { text: string; timing: string }[];
  steps: {
    text: string;
    note?: string | null; // コツ・注意・補足（調理モードで小さめに出す）
    timerSec?: number | null;
    uses?: number[]; // このステップで使う材料（ingredients の番号）
    image?: string | null; // 手順の写真の URL（元ページにあれば）
    alerts?: { atSec: number; text: string }[];
  }[];
};

// 1g未満が意味を持つ材料（イースト・塩など）は小数1桁
const FINE = /イースト|塩|ベーキングパウダー|重曹|BP|ドライ/;

export function formatGrams(g: number, name: string): string {
  if (FINE.test(name) && g < 10) return (Math.round(g * 10) / 10).toString();
  return Math.round(g).toString();
}

// 倍率 = 新しい量 / 基準材料の grams
export function scaleRatio(base: Ingredient | undefined, newAmount: number): number {
  if (!base || !base.grams || !newAmount || newAmount <= 0) return 1;
  return newAmount / base.grams;
}

// 換算後の分量の表示（grams が null なら元の表記のまま）
export function scaledAmount(ing: Ingredient, ratio: number): { text: string; approx: boolean } {
  if (ing.grams == null) return { text: ing.original, approx: false };
  return { text: `${formatGrams(ing.grams * ratio, ing.name)}g`, approx: ing.estimated };
}
