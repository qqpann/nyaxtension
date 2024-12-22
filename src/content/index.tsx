import 'webextension-polyfill';
import 'construct-style-sheets-polyfill';
import { fileURLToPath } from 'url';
import kuromoji from 'kuromoji';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { debounce } from 'lodash-es';
import { twind, config, cssom, observe, stringify } from './twind';
import { proxyStore } from '../app/proxyStore';
import Content from './Content';
import path from 'path';

import OpenAI from 'openai';

async function isTweetToxic(text: string): Promise<boolean> {
  // OpenAI APIキーの取得
  const items = await chrome.storage.local.get([
    'openaiApiKey',
    'toxicDefinition',
    'toxicExamples',
  ]);
  const openaiApiKey = items.openaiApiKey;

  if (!openaiApiKey) {
    throw new Error('OpenAI APIキーが見つかりません');
  }

  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: openaiApiKey,
  });

  // プロンプトの組み立て
  const toxicDefinition =
    items.toxicDefinition ||
    '1. 読む人にストレスを与える表現を含む\n2. 攻撃的な表現を含む\n3. 嘲笑的な表現を含む';
  const toxicExamples = items.toxicExamples;
  const toxicExamplesPrompt =
    typeof toxicExamples === 'string' && toxicExamples.length > 0
      ? `
以下にいくつかの例を示します:
${toxicExamples}`
      : '';
  const prompt = `
以下の文章が不快かどうかを判断してください。不快である場合はtrue、それ以外はfalseを返してください。
不快の定義:
${toxicDefinition}
${toxicExamplesPrompt}

判定する文章:
\`\`\`
${text}
\`\`\`

結果をJSON形式で返してください。例: {"toxic": true}
  `;

  // OpenAI APIへのリクエスト
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview', // JSONモード対応モデルを指定
    messages: [
      { role: 'system', content: 'あなたは返答をすべてJSON形式で出力します。' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' }, // JSONモードを指定
  });

  // レスポンスから結果を解析
  const responseContent = completion.choices[0].message?.content || '{}';
  try {
    const result = JSON.parse(responseContent);
    // console.log('OpenAI結果:', result);
    const toxic = result.toxic ?? false;
    if (toxic) {
      console.warn('不快な内容が含まれています:', text);
    }
    return toxic;
  } catch (e) {
    console.error('JSON解析エラー:', e, responseContent);
    return false;
  }
}

async function convertToCatLanguageByLLM(text: string): Promise<string> {
  const toxic = await isTweetToxic(text);
  if (toxic) {
    return convertToCatLanguage(text);
  } else {
    // return convertToCatLanguage(text);
    return text;
  }
}

console.log('processTweets');
proxyStore.ready().then(() => {
  // FIXME: どうやって一致を取っているのかわからない
  let text = '';
  // ツイートを猫語に変換する
  // なお、ツイートの読みおこみは遅れて行われるため、MutationObserverで監視する
  const processTweets = debounce(() => {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');

    tweets.forEach((tweet) => {
      const tweetText = tweet.querySelector<HTMLDivElement>('[data-testid="tweetText"]');
      const caretButton = tweet.querySelector('[data-testid="caret"]');

      if (tweetText) {
        if (caretButton && !caretButton.classList.contains('nyax-caret-listener')) {
          caretButton.addEventListener('click', () => {
            // TODO: ツイートのテキストを取得?
            console.log(tweetText.innerText);
            text = tweetText.innerText;
          });
          caretButton.classList.add('nyax-caret-listener');
        }

        if (!tweetText.classList.contains('nyax-processed')) {
          // TODO: AIで猫語に変換する
          console.log('猫語に変換');
          tweetText.classList.add('nyax-processed'); // 再処理を防ぐ
          convertToCatLanguageByLLM(tweetText.innerText)
            .then((catText) => {
              tweetText.innerText = catText;
              console.log('猫語', catText);
            })
            .catch((e) => {
              console.error('猫語失敗', e);
            });
        }
      }
    });

    // ドロップダウンメニューを探す
    const dropdownMenu = document.querySelector('[data-testid="Dropdown"]');
    if (dropdownMenu && !dropdownMenu.classList.contains('nyax-processed-menu')) {
      // 既存のボタンを取得
      const existingButton = dropdownMenu.querySelector('[role="menuitem"]');
      if (existingButton) {
        // ボタンをコピー
        const clonedButton = existingButton.cloneNode(true) as HTMLElement;

        // SVG部分を置き換え
        const svgElement = clonedButton.querySelector('svg');
        if (svgElement) {
          svgElement.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18.75" height="18.75" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cat"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>`;
        }

        // 文言を変更
        const textElement = clonedButton.querySelector('span');
        if (textElement) {
          textElement.innerText = '興味がないにゃん';
        }

        // ボタンのクリックイベントを更新
        clonedButton.addEventListener('click', async () => {
          // alert('猫語変換ボタンが押されました！' + text);
          const flattenedText = text.replace(/\n/g, ' ');
          const items = await chrome.storage.local.get(['toxicExamples']);
          const toxicExamples = (items.toxicExamples as string | undefined) ?? '';
          const newToxicExamples = toxicExamples.trim() + '\n' + '- ' + flattenedText;
          chrome.storage.local.set({ toxicExamples: newToxicExamples.trim() });
        });

        // ドロップダウンメニューの最初に挿入
        dropdownMenu.insertBefore(clonedButton, dropdownMenu.firstChild);

        // メニューにフラグを追加して再処理を防ぐ
        dropdownMenu.classList.add('nyax-processed-menu');
      }
    }
  }, 10);

  // Twitterのメインコンテンツ部分に絞って監視
  const observerTarget = document.querySelector('[data-testid="primaryColumn"]');
  if (observerTarget) {
    const observer = new MutationObserver(() => processTweets());
    observer.observe(observerTarget, { childList: true, subtree: true });
  }

  // 初期ロード時に処理を実行
  processTweets();
});

type ParsedWord = {
  word?: string;
  attrs?: (string | undefined)[];
};

const catSounds1 = ['にゃ', 'にゅ', 'みゃ'];
const catSounds2 = [
  'にゃん',
  'みゃ〜',
  'みゃみゃ',
  'み〜',
  'みゃう',
  'にゃう',
  'にゃあ',
  'にゃにゃ',
  'にゃ〜',
  'にゅ〜',
  'うにゃ',
  'うにゅ',
];
const catSounds3 = [
  'にゃにゃ〜',
  'みゃみゃ〜',
  'うにゃ〜',
  'うにゃあ',
  'にゃ〜お',
  'みゃ〜お',
  'にゃお〜',
  'みゃお〜',
  'にゃ〜ん',
  'みゃ〜ん',
];
const catSounds4 = [
  'にゃお〜ん',
  'にゃうにゃう',
  'ごろごろ',
  'ごろにゃ〜',
  'にゃんにゃん',
  'ごろにゃん',
];

/**
 * min以上max以下の整数をランダムに返す
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const catSoundsMap: Record<number, string[]> = {
  1: catSounds1,
  2: catSounds2,
  3: catSounds3,
  4: catSounds4,
};
function getRandomCatSoundBySize(chunkSize: number): string {
  const sounds = catSoundsMap[chunkSize] ?? catSounds4;
  return sounds[randomInt(0, sounds.length - 1)];
}

/**
 * 1つの単語(読み)を猫語に変換する
 */
function convertSingleWordToCat(curYomi: string): string {
  // 小文字(ゃゅょ)を削除して長さを算出
  const curYomiOto = curYomi.replace(/[ゃゅょ]/g, '');
  let length = Array.from(curYomiOto).length;
  let result = '';

  // 長さが4文字以下なら一度だけ
  if (length <= 4) {
    result += getRandomCatSoundBySize(length);
  } else {
    // 4文字を超える場合、1〜4文字の塊に分割して猫語を追加していく
    while (length > 0) {
      const chunkSize = Math.min(randomInt(1, 4), length);
      result += getRandomCatSoundBySize(chunkSize);
      length -= chunkSize;
    }
  }
  return result;
}

/**
 * MeCabでパースされた配列を元に猫語に変換する
 */
async function convertToCatLanguage(text: string): Promise<string> {
  const parsedWords = await parseText(text);
  let convertedComment = '';

  for (const parsedWord of parsedWords) {
    const curYomi = parsedWord.attrs?.[7] ?? parsedWord.word ?? null;
    if (!curYomi || curYomi === 'EOS' || curYomi.trim() === '') continue;

    // 記号をそのまま使用
    if (/^[ー！？!?、。]+$/u.test(curYomi) || /^[ー！？!?、。]+$/u.test(parsedWord.word ?? '')) {
      convertedComment += parsedWord.word;
      continue;
    }

    // 読みが '*' の場合はスキップ
    if (curYomi === '*') {
      continue;
    }

    // 猫語に変換
    convertedComment += convertSingleWordToCat(curYomi);
  }

  // 最後に文字置換
  return convertedComment.replace(/ー/g, '〜').replace(/!/g, '！').replace(/\?/g, '？');
}

// 形態素解析を行う関数
async function parseText(text: string): Promise<ParsedWord[]> {
  return new Promise((resolve, reject) => {
    // const dicPath = path.resolve(fileURLToPath(import.meta.url), './dict');
    // const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dicPath = chrome.runtime.getURL('dict');
    kuromoji
      .builder({ dicPath })
      // .builder({ dicPath: '/node_modules/kuromoji/dict/' })
      // .builder({ dicPath: chrome.extension.getURL(path.join(__dirname, '/dict')) })
      // .builder({ dicPath: chrome.extension.getURL('/dict') })
      // .builder({ dicPath: '/dict' })
      // .builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' })
      .build((err, tokenizer) => {
        if (err) {
          return reject(err);
        }

        // トークン化
        const tokens = tokenizer.tokenize(text);

        // `ParsedWord` フォーマットに変換
        const parsedWords: ParsedWord[] = tokens.map((token) => ({
          word: token.surface_form,
          attrs: [
            token.pos, // 品詞
            token.pos_detail_1, // 品詞細分類1
            token.pos_detail_2, // 品詞細分類2
            token.pos_detail_3, // 品詞細分類3
            token.conjugated_type, // 活用型
            token.conjugated_form, // 活用形
            token.basic_form, // 基本形
            token.reading, // 読み
            token.pronunciation, // 発音
          ],
        }));

        resolve(parsedWords);
      });
  });
}

// // 使用例
// const parsedWordsSample: ParsedWord[] = [
//   {
//     word: 'こんにちは',
//     attrs: [
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       'コンニチハ',
//     ],
//   },
//   { word: '！', attrs: [] },
// ];

// console.log(convertToCatLanguage(parsedWordsSample));
