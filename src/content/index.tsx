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
  const contentRoot = document.createElement('div');
  contentRoot.id = 'my-extension-root';
  contentRoot.style.display = 'contents';
  document.body.append(contentRoot);

  const shadowRoot = contentRoot.attachShadow({ mode: 'open' });
  const sheet = cssom(new CSSStyleSheet());

  // shadowRoot.adoptedStyleSheet bug in firefox
  // see: https://bugzilla.mozilla.org/show_bug.cgi?id=1827104
  if (navigator?.userAgent.includes('Firefox')) {
    const style = document.createElement('style');
    const debouncedSyncCss = debounce(() => {
      style.textContent += stringify(sheet.target);
    }, 100);

    const originalSheetInsert = sheet.insert;
    (sheet.insert as typeof originalSheetInsert) = (...params) => {
      originalSheetInsert(...params);
      debouncedSyncCss();
    };
    shadowRoot.appendChild(style);
  } else {
    shadowRoot.adoptedStyleSheets = [sheet.target];
  }

  const tw = twind(config, sheet);
  observe(tw, shadowRoot);

  const shadowWrapper = document.createElement('div');
  shadowWrapper.id = 'root';
  shadowWrapper.style.display = 'contents';
  shadowRoot.appendChild(shadowWrapper);

  createRoot(shadowWrapper).render(
    <React.StrictMode>
      <Provider store={proxyStore}>
        <Content />
      </Provider>
    </React.StrictMode>
  );

  // ツイートを猫語に変換する
  // なお、ツイートの読みおこみは遅れて行われるため、MutationObserverで監視する
  const processTweets = () => {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');

    tweets.forEach((tweet) => {
      const tweetText = tweet.querySelector<HTMLDivElement>('[data-testid="tweetText"]');
      if (tweetText) {
        if (!tweetText.classList.contains('nyax-processed')) {
          // TODO: AIで猫語に変換する
          tweetText.innerText = 'ニャーん';
          tweetText.classList.add('nyax-processed'); // 再処理を防ぐ
        }

        const caretButton = tweet.querySelector('[data-testid="caret"]');
        caretButton?.addEventListener('click', () => {
          // TODO: remember tweet text
          console.log(tweetText.innerText);
        });
      }
    });
  };

  const observer = new MutationObserver(() => processTweets());
  observer.observe(document.body, { childList: true, subtree: true });

  // 初期ロード時に処理を実行
  processTweets();
});
