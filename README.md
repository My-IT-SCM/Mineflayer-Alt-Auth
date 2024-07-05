# Mineflayer-Alt-Auth

### Requirements

### Features


### Getting Started
1. Install dependencies
```bash
npm install mineflayer mineflayer-alt-auth
```

2. Get your alt token or account from their website, can be [EasyMC](https://easymc.io/) and [The Altening](https://thealtening.com/)

3. Example Usage
```js
const mineflayer = require("mineflayer");
const authClient = require("auth-client");
const path = require("path");

const bot = mineflayer.createBot({
  host: "60.53.184.131",
  username: "o8mqb-efe6y@alt.com",
  auth: authClient({
    cache: true,
    cacheFile: path.join(__dirname, "./cache.json"),
    provider: "thealtening",
  }),
  version: "1.12.2",
});

```