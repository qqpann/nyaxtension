import 'webextension-polyfill';
import 'construct-style-sheets-polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { debounce } from 'lodash-es';
import { twind, config, cssom, observe, stringify } from './twind';
import { proxyStore } from '../app/proxyStore';
import Content from './Content';

proxyStore.ready().then(() => {
  // ツイートを猫語に変換する
  // なお、ツイートの読みおこみは遅れて行われるため、MutationObserverで監視する
  const processTweets = debounce(() => {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');

    tweets.forEach((tweet) => {
      const tweetText = tweet.querySelector<HTMLDivElement>('[data-testid="tweetText"]');
      const caretButton = tweet.querySelector('[data-testid="caret"]');

      if (tweetText) {
        if (!tweetText.classList.contains('nyax-processed')) {
          // TODO: AIで猫語に変換する
          tweetText.innerText = 'ニャーん';
          tweetText.classList.add('nyax-processed'); // 再処理を防ぐ
        }

        if (caretButton && !caretButton.classList.contains('nyax-caret-listener')) {
          caretButton.addEventListener('click', () => {
            // TODO: ツイートのテキストを取得?
            console.log(tweetText.innerText);
          });
          caretButton.classList.add('nyax-caret-listener');
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

        // 文言を変更
        const textElement = clonedButton.querySelector('span');
        if (textElement) {
          textElement.innerText = '猫語変換ボタン';
        }

        // ボタンのクリックイベントを更新
        clonedButton.addEventListener('click', () => {
          alert('猫語変換ボタンが押されました！');
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
