import fs from 'fs/promises';
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolMina, MinaTokenHolder, FungibleToken, PoolMinaDeployProps, FungibleTokenAdmin, mulDiv } from './indexmina.js';
import readline from "readline/promises";

// node build/src/cache.js

const cache = Cache.FileSystem('./cache');
await PoolMina.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
await MinaTokenHolder.compile({ cache });

const folder = await fs.readdir("./cache");

const fileName = folder.filter(x => x.indexOf('-pk-') === -1);
const json = JSON.stringify(fileName);


await fs.cp('./cache', '../website/public/cache', {
    recursive: true, filter: (source, _destination) => {
        console.log(source, _destination, source.indexOf('-pk-') === -1);
        return source.indexOf('-pk-') === -1;
    }
});

await fs.writeFile('../website/public/compiled.json', json, 'utf8');