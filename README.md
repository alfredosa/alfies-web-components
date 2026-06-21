# Alfie's Web Components

My own cool components that probably nobody should use, except me. But I make them public because I want them to be accessible even in private repos :). If you like them thats cool tho.

> I can't guarantee any of them work. But it works on my machine - Alfie

This is my never ending quest of writting my own software.

## Packages

- `@alfiexco/animated-sprite` - generic canvas sprite actor migrated from
  Inksight's `Orc`; consumers provide idle/walk/action sprite sheets.
- `@alfiexco/layered-object` - customizable stacked frame migrated from
  Biomehub's `StackedObject`; exposes primary/secondary colors and borders.
- `@alfiexco/pixel-forest` - animated pixel tree scene migrated from Biomehub's
  dashboard `TreeScene`; configurable palettes, density, wind, and sizing.
- `@alfiexco/rain` - canvas rain and lightning effect migrated from Inksight's
  `RainEffect`; configurable intensity, color, scale, wind, and lightning.
- `@alfiexco/settings` - typed React settings provider factory migrated from the
  existing Inksight settings package.

## Install

```sh
npm install @alfiexco/animated-sprite
npm install @alfiexco/layered-object
npm install @alfiexco/pixel-forest
npm install @alfiexco/rain
npm install @alfiexco/settings
```

## Local Development

Install dependencies:

```sh
npm install
```

Build every package:

```sh
npm run build
```

Type-check every package:

```sh
npm run typecheck
```

## Creating a New Package

Create a folder under `packages/` with this shape:

```text
packages/my-component/
  package.json
  tsconfig.json
  src/index.tsx
```

Use a package name like `@alfiexco/my-component`, keep `react` as a peer
dependency for React components, and publish from the workspace.

## Publishing

1. Create an npm access token with publish permission.
2. Add it to the GitHub repository secrets as `NPM_TOKEN`.
3. Update package versions.
4. Publish a GitHub Release or run the `Publish packages` workflow manually.

The workflow builds the workspaces and publishes all packages with npm
provenance.
