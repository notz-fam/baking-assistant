// URL のページを取得してテキスト化（最小限）
export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RecipeViewer/1.0)",
      "Accept-Language": "ja,en;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // schema.org Recipe の ld+json があれば優先
  const ldBlocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldBlocks) {
    if (/"@type"\s*:\s*\[?\s*"Recipe"/.test(m[1])) return m[1].slice(0, 30000);
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<img\s[^>]*>/gi, (tag) => imageMarker(tag, url))
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 30000);
}

// 写真を「[写真 URL]」の目印にして文章の中に残す。手順のどこに写真があるかを LLM が判断できるように
// ロゴ・アイコン・バナー・小さな商品画像は除く
const SKIP_IMG = /logo|icon|ico_|btn|button|banner|bn_|footer|header|ranking|arrow|avatar|sprite|\.svg/i; // 手順の写真に GIF を使うサイトもあるので GIF は除外しない

const ATTR = {
  dataSrc: /\sdata-src\s*=\s*["']([^"']+)["']/i,
  dataOriginal: /\sdata-original\s*=\s*["']([^"']+)["']/i,
  src: /\ssrc\s*=\s*["']([^"']+)["']/i,
  width: /\swidth\s*=\s*["']?(\d+)/i,
};

function imageMarker(tag: string, pageUrl: string): string {
  const src = tag.match(ATTR.dataSrc)?.[1] || tag.match(ATTR.dataOriginal)?.[1] || tag.match(ATTR.src)?.[1];
  if (!src || src.startsWith("data:") || SKIP_IMG.test(src)) return " ";
  const width = Number(tag.match(ATTR.width)?.[1]);
  if (width && width < 100) return " ";
  try {
    const abs = new URL(src.replace(/&amp;/g, "&"), pageUrl).href;
    return abs.startsWith("https://") ? ` [写真 ${abs}] ` : " ";
  } catch {
    return " ";
  }
}
