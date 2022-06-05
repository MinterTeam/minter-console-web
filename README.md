# Minter Console Website

[![Build Status](https://img.shields.io/github/workflow/status/MinterTeam/minter-console-web/Test?label=test&style=flat-square)](https://github.com/MinterTeam/minter-console-web/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&label=license)](https://github.com/MinterTeam/minter-console-web/blob/master/LICENSE)

This is the repository containing the code for the official Minter Console website [console.minter.network](https://console.minter.network)

## Install

- clone the repo
- ensure latest stable Node.js and NPM are installed
- install node_modules `npm ci`
- copy .env.master `cp .env.master .env`
- set correct .env variables
- build `npm run production`
- now you have static assets in the `./dist/` folder, you have to distribute them with some web server like Nginx (or run `npm run start`, but it's not recommended for production)


## Deployment script

Build in Nuxt SPA mode
```
npm ci && npm run production
```
Root folder: `./dist/`


### Nuxt build cheatsheet

``` bash
# install dependencies
$ npm install # Or yarn install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, checkout the [Nuxt.js docs](https://github.com/nuxt/nuxt.js).
