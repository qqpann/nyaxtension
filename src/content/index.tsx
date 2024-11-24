import 'webextension-polyfill';
import 'construct-style-sheets-polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { debounce } from 'lodash-es';
import { twind, config, cssom, observe, stringify } from './twind';
import { proxyStore } from '../app/proxyStore';
import Content from './Content';

import OpenAI from 'openai';
const openai = new OpenAI({
  // FIXME: どうやってAPIキーを隠すのかわからない
  dangerouslyAllowBrowser: true,
});

async function convertToCatLanguage(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a human-to-cat translator.' },
      {
        role: 'user',
        content: `\`\`\`\n${text}\`\`\`\n上記のツイート文章に攻撃的表現や読む人にストレスを与える表現がある場合、元の文章が推測不能になるくらい猫語（にゃん、ニャーなど）に変換してください。`,
      },
    ],
  });

  console.log(completion.choices[0].message);
  return completion.choices[0].message.content ?? text;
}

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
          convertToCatLanguage(tweetText.innerText)
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
        clonedButton.addEventListener('click', () => {
          alert('猫語変換ボタンが押されました！' + text);
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
