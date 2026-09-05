# Turn-Based Strategy Game

Independent turn-based strategy game built on the MIT-licensed game engine by Nakazawa Tech KK. This fork ships its own product identity, content, and assets.

The underlying engine and associated libraries in this repository are licensed under the [MIT License](./LICENSE.md).

## Architecture

This project uses the engine core packages (`athena`, `apollo`, `hera`, `dionysus`, etc.) as its game engine and strategy game library while utilizing custom game assets, faction rosters, and units.

## Setup

Requires [Node.js](https://nodejs.org/en/download/package-manager) and the latest major version of [`pnpm`](https://pnpm.io/installation).

> [!NOTE]
>
> <details><summary>Windows Specific Config</summary>
> Developers on Windows will want to ensure that they are using `bash` to run `package.json` scripts. You can configure npm to use git bash by default with the following:
>
> ```bash
> npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
> ```
>
> </details>

```bash
pnpm install && pnpm dev:setup
pnpm dev:docs
```

Visit [localhost:3003](http://localhost:3003/) to see the docs page.

## Documentation

See local docs after setup.

### Packages

The codebase is split into multiple packages to enforce the separation of concerns. We suggest starting with these packages to get an end-to-end overview:

- `athena` → Data structures and algorithms for manipulating _map_ state (_client/server_).
- `apollo` → Data structures and algorithms for manipulating _game_ state (_client/server_).
- `hera` → Game engine and rendering (_client_).
- `ui` → Design system (_client_).
- `docs` → Docs & Playground (_client_).

These are secondary packages focused on specific domains:

- `art` → Handling of assets (_client/build_).
- `codegen` → Run `pnpm codegen` when changing game `Action`s or `ActionResponse`s to generate encoded actions and formatters (_build_).
- `dionysus` → AI code (_client/server_).
- `hermes` → Campaign related data structures and algorithms (_client/server_).
- `i18n` → Internationalization (_client/build_).
- `offline` → Offline splash screen for app (_client_).
- `tests` → e2e tests.

# Contributing

Guidelines:

- The style guide is enforced through tests and linting. Please run `pnpm test` to run all checks. If they pass, you are good to send a Pull Request.
- We suggest adding tests to Pull Requests. See the `tests` folder for examples.
