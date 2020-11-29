# snowpack-plugin-hash

Makes use of [ts-morph](https://ts-morph.com/) and [posthtml](https://github.com/posthtml/posthtml) to apply
content hashes to all of your build assets. This can be helpful in production to allow caching files permanently since the hashes are determinstic based on the contents of the file. 

## Features

- SHA-256 Content Hashes for JS, JSX, and CSS files.
- SourceMap generation w/ remapping support
- Remaps `import-map.json` to reference hashes
- Generates an asset manifest for all files

## Install

```sh
npm i --save-dev snowpack-plugin-hash

yarn add -d snowpack-plugin-hash
```

## Usage

```js
// snowpack.config.js

module.exports = {
  ...config,
  plugins: [
    [
      'snowpack-plugin-hash',
      // Entirely optional object. Showing default values
      {
        // Passed along to ts-morph, if you need a specific TS config
        tsConfig: undefined
        // Configure length of hashes
        hashLength: 12 
        // Configure output of asset manifest, relative to buildDirectory.
        assetManifest: 'asset-manifest.json' 
      }
    ]
  ]
}
```