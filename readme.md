# snowpack-plugin-hash

Makes use of [ts-morph](https://ts-morph.com/) and [posthtml](https://github.com/posthtml/posthtml) to apply
content hashes to all of your build outputs. This can be helpful in production to allow caching files permanently since the hases are determinstic based on the contents of the file.

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
      // Entirely optional object
      {
        tsConfig: 'tsconfig.json' // Default, used to configure ts-morph
        hashLength: 12 // Default, used to configure length of hashes
      }
    ]
  ]
}
```

## TODO

- [ ] Support Sourcemaps
