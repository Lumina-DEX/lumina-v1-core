# Mina zkApp: Lumina Mvp

This template uses TypeScript.

### Generate key
(usefull for test)
 ``` 
node src/key.js
 ```

### GraphQL
https://api.minascan.io/node/devnet/v1/graphql
https://devnet.zeko.io/graphql

### Get Balance
Update graphql, account and token in src/deploy/getBalance.ts 

```
npm run build
node build/src/deploy/getBalance.js
```

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
