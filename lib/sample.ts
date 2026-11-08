import type { Recipe } from "./recipe";

// ベーグルの取り込み結果（API が落ちたときのデモ用）
export const sampleRecipe: Recipe = {
  "title": "つやつや、もちもち!基本のプレーンベーグル♪",
  "yield": {
    "servings": "小振りなもの6コ分"
  },
  "ingredients": [
    {
      "name": "強力粉",
      "original": "240g",
      "grams": 240,
      "estimated": false
    },
    {
      "name": "塩",
      "original": "5g",
      "grams": 5,
      "estimated": false
    },
    {
      "name": "さとうきび糖",
      "original": "10g",
      "grams": 10,
      "estimated": false
    },
    {
      "name": "ドライイースト",
      "original": "3g",
      "grams": 3,
      "estimated": false
    },
    {
      "name": "水",
      "original": "155g",
      "grams": 155,
      "estimated": false
    },
    {
      "name": "はちみつまたはさとうきび糖（ケトリング用）",
      "original": "大さじ1",
      "grams": 21,
      "estimated": true
    }
  ],
  "prepTasks": [
    {
      "text": "ベーキングシートを小さく切って用意する",
      "timing": "成形を始める前に"
    },
    {
      "text": "オーブンを220℃で予熱開始する",
      "timing": "手順9で発酵させている間に"
    },
    {
      "text": "大きめのフライパンにケトリング用のはちみつを入れ、多めに湯を沸かす",
      "timing": "手順9で発酵させている間に"
    }
  ],
  "steps": [
    {
      "text": "材料を全てホームベーカリーにセットし、捏ね(強)で約15分。表面がつるっとしたら完了。ケトリング用の糖分は入れない。",
      "timerSec": 900,
      "uses": [0, 1, 2, 3, 4],
      "alerts": []
    },
    {
      "text": "1次発酵はしないので取り出し、すぐにドレッジで6等分にしてベンチタイム10分。並べた天板ごと大きなポリ袋で覆い、風船のように膨らませて乾燥を防ぐ。",
      "timerSec": 600,
      "alerts": []
    },
    {
      "text": "ガス抜き麺棒で幅15cmくらいの長方形にする。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "手前から空気を入れないようにくるくる巻く。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "しっかりつまんで閉じる。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "コロコロと太さを整えた後、端を少し潰す。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "くるっと輪っかにして、潰した部分で端を包み込み、しっかりつまんで閉じる。とじ目は底にくるように成形する。水分が少ない生地なので手早く作業する。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "成形したベーグルは小さく切ったオーブンシートに1つずつ乗せておく。",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "オーブンの発酵機能を使って35℃で10分ほど発酵させる。取り出して天板ごと大きなポリ袋へ入れておく。部屋があたたかい場合は発酵機能を使わず室温発酵でも可。",
      "timerSec": 600,
      "alerts": []
    },
    {
      "text": "予熱が完了したら、ボコボコ沸騰させず小さな泡がふつふつしている程度のお湯にシートを外して入れ、片面30秒、両面茹でる。茹ですぎると表面が粗くなるので注意。",
      "timerSec": 60,
      "uses": [5],
      "alerts": []
    },
    {
      "text": "茹で上がったら即座に、210℃に落としたオーブンで20分焼成する。焼きムラのあるオーブンの場合は途中で前後を入れ替える。",
      "timerSec": 1200,
      "alerts": []
    },
    {
      "text": "できあがり！",
      "timerSec": null,
      "alerts": []
    },
    {
      "text": "米粉入りにする場合は強力粉30gをグルテン入りの米粉に置き換える。ポピーシードや黒ごま入りにする場合は10g程度を追加する。",
      "timerSec": null,
      "alerts": []
    }
  ],
  "sourceUrl": "https://www.cotta.jp/recipe/recipe.php?recipeid=00013028"
};
