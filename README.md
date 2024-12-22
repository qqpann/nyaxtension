# nyaXtension

<p align="center">A cross-platform (Chrome, Firefox, Edge, Opera, Brave) web browser extension (Manifest V3 and Manifest V2) starter kit with hot reload support, built with React, Typescript, Redux, Vite, ESLint, Prettier, TailwindCSS, Jest and more! </p>
<hr />

<div align="center" >
  <a href="https://github.com/sinanbekar/browser-extension-react-typescript-starter/actions">
    <img src="https://github.com/sinanbekar/browser-extension-react-typescript-starter/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
    &nbsp;
  <a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome">
  </a>

</div>

> 🚀 Read the article here: {tbd}

## Features

- Recognize negative tweets
- Turn them into cat meow

[^1]: While it is fully supported and stable in most cases, hard reloading is rarely recommended.

## Quick Start

Then run the following:

- `yarn install` to install dependencies.
- `yarn dev` to start the development server.
- `yarn build` to build an unpacked extension.

- **Load extension in Chrome (Chromium, Manifest V3)**

  - Go to the browser address bar and type `chrome://extensions`
  - Check the `Developer Mode` button to enable it.
  - Click on the `Load Unpacked Extension` button.
  - Select your `dist` folder in the project root.

- **Load extension in Firefox (Manifest V2)**

  - Go to the browser address bar and type `about://debugger`
  - Click on the `Load Temporary Add-on` button.
  - Select your `dist-firefox-v2` folder in the project root.

### Available Commands

- `yarn clean` to remove dist folder. `dev` and `build` commands call this command.
- `yarn format` to fix code with eslint and prettier.
- `yarn lint` to call ESLint and Prettier.
- `yarn test` for testing.

### Redux

You can use redux (redux-toolkit) as state manager between popup, background, content and custom pages. Read the documentation for more.

#### [@eduardoac-skimlinks/webext-redux](https://github.com/eduardoacskimlinks/webext-redux)

### Bundling

#### [@crxjs/vite-plugin](https://github.com/crxjs/chrome-extension-tools)

> **Note** This plugin powers the development side of this starter.
>
> docs: https://crxjs.dev/vite-plugin
>
> Special thanks to [@jacksteamdev](https://github.com/jacksteamdev) and contributors for this amazing plugin.

## Contributing

This repository is following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard.

## License

MIT © [Sinan Bekar](https://sinan.engineer)
