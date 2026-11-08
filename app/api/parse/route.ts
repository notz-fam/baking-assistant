import Anthropic from "@anthropic-ai/sdk";
import { fetchPageText } from "@/lib/fetchPage";
import { recipeSchema } from "@/lib/schema";
import type { Recipe } from "@/lib/recipe";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic(); // ANTHROPIC_API_KEY はサーバー側でのみ読む

const SYSTEM = `あなたはパン・お菓子のレシピを整理する編集者です。渡されたWebページのテキスト（またはレシピ本文）から、レシピを1つ抜き出してJSONにしてください。

- title：レシピ名
- ingredients：材料を元の順番で。original には分量部分だけを元の表記のまま（材料名は入れない。「240g」「大さじ1」「1個分」「2袋分(4~5g)」など）をそのまま残す。grams にはグラム換算値を入れる。
  - 元がgで書かれていれば estimated: false
  - 個数・cc・ml・大さじ・小さじ・「〜分」など換算に推定が入るものは estimated: true（例：卵黄1個分≈20g、はちみつ大さじ1≈21g、水100cc=100g でも estimated: true）
  - 「適量」「少々」「打ち粉」などグラムにできないものは grams: null
  - 材料が「A」「B」「☆」「★」「◎」「①」「(a)」などの記号や「生地」「クリーム」などの小見出しでまとめられていたら、各材料の group にその記号・見出しをそのまま入れる（「A」「☆」「生地」など）。まとめられていない材料は group: null。グループの見出し自体は材料として入れない
- prepTasks：始める前にやっておくこと。「下準備」欄の内容に加え、手順の後半で初めて出てくるが事前にやっておかないと困ることも必ず拾う（オーブンの予熱〇℃、ケトリング用・湯せん用のお湯を沸かす、湯をはったバット、材料を常温・室温に戻す、粉をふるう、卵白を冷やす、型にシートを敷く、天板の準備など）。text は短い命令形（「オーブンを220℃に予熱する」）。timing は「最初に」「生地を休ませている間に」「手順9の前までに」など、いつまでにやるか。
- steps：手順を順番に。文章は短く言い換えてよいが、温度・時間・分量は絶対に変えない。
  - text は、手が汚れた状態で離れて読む前提で「何をするか」だけを短く（目安40字以内、1〜2文）。温度・時間・分量・速さ（低速・中速など）・できあがりの目安（「ツヤが出るまで」など）は text に残す
  - 理由・コツ・注意・「※」の補足・言い換えは note に移す（目安60字以内）。なければ null。note にしか書かれていない作業を作らない
  - 待ち時間・焼成時間があれば timerSec（秒）、なければ null。焼成途中の指示（「20分でアルミホイルをかぶせる」など）があれば alerts、なければ空配列。
  - 括弧の補足は、手順の文中に「A」「B」「☆」「★」「◎」「①」のような短い記号が材料の代わりに書かれているときだけ行う：その記号の直後に括弧で材料名を補う（「Aを加える」→「A（砂糖・塩・水）を加える」）。分量は書かない。それ以外の手順（材料名が書かれている、「レモンアイシング」のような見出し名で書かれている）には括弧を一切足さず、元の文のままにする
  - uses：そのステップで新しく加える・使う材料の ingredients の番号（0始まり）。グループで指定されていればグループ内の全材料の番号を入れる。材料を使わないステップは空配列
- steps の image：元の手順に写真の URL（HowToStep の image、またはテキスト中の「[写真 URL]」）があれば、その URL を一字も変えずにそのまま入れる。「[写真 URL]」は、その直前に書かれている手順の写真（手順番号と文章のあとに写真が置かれていることが多い）。手順の範囲の外にある写真（メイン写真・商品・関連レシピなど）は使わない。手順をまとめた・分けた場合は対応する写真を1枚だけ。写真がなければ null。URL を作ったり推測したりしない
- yield：何個分・型の種類やサイズがわかれば入れる。わからない項目は省く。
- ページ内の関連レシピ・広告・商品紹介は無視する。`;

const FETCH_FAIL = "ページを取得できませんでした。レシピの文章をコピーして貼り付けてください";

export async function POST(req: Request) {
  const { input } = (await req.json()) as { input?: string };
  const value = (input ?? "").trim();
  if (!value) return Response.json({ error: "URL かレシピの文章を入れてください" }, { status: 400 });

  let text = value;
  let sourceUrl: string | undefined;
  if (/^https?:\/\//i.test(value)) {
    sourceUrl = value;
    try {
      text = await fetchPageText(value);
      if (text.length < 200) throw new Error("too short");
    } catch {
      return Response.json({ error: FETCH_FAIL }, { status: 502 });
    }
  } else {
    text = value.slice(0, 30000);
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      system: SYSTEM,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: recipeSchema as unknown as Record<string, unknown> },
      },
      messages: [{ role: "user", content: `次のテキストからレシピを抜き出してください。\n\n${text}` }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error(`no text (stop_reason: ${response.stop_reason})`);
    const recipe = JSON.parse(block.text) as Recipe;
    if (sourceUrl) recipe.sourceUrl = sourceUrl;
    // 写真の URL は、渡したテキストに実際にあるものだけ残す（書き間違い・作り話を防ぐ）
    for (const s of recipe.steps) {
      if (s.image && !(/^https:\/\//.test(s.image) && text.includes(s.image))) s.image = null;
    }
    return Response.json({ recipe });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "レシピを読み取れませんでした。もう一度試すか、サンプルを読み込んでください" }, { status: 500 });
  }
}
