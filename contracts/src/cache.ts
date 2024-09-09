import fs from 'fs/promises';
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolMina, MinaTokenHolder, FungibleToken, PoolMinaDeployProps, FungibleTokenAdmin, mulDiv } from './indexmina.js';
import readline from "readline/promises";
import path from 'path';

// node build/src/cache.js

const cache = Cache.FileSystem('./cache');
for (let index = 0; index < 3; index++) {
    // compile 3 time to get all files
    await PoolMina.compile({ cache });
    await FungibleToken.compile({ cache });
    await FungibleTokenAdmin.compile({ cache });
    await MinaTokenHolder.compile({ cache });
}

const folder = await fs.readdir("./cache");

const filter = (x: string) => { return x.indexOf('-pk-') === -1 && x.indexOf('.header') === -1 };
const fileName = folder.filter(filter);
const json = JSON.stringify(fileName);


await fs.cp('./cache', '../website/public/cache', {
    recursive: true, filter: (source, _destination) => {
        return filter(source);
    }
});


const folderPath = '../website/public/cache';
let filesArr = await fs.readdir(folderPath);

// Loop through array and rename all files 
filesArr.forEach(async (file) => {
    let fullPath = path.join(folderPath, file);
    let fileExtension = path.extname(file);
    let fileName = path.basename(file, fileExtension);

    // we use textfile to get browser compression
    let newFileName = fileName + ".txt";
    try {
        await fs.rename(fullPath, path.join(folderPath, newFileName));
    } catch (error) {
        console.error(error)
    }
});

await fs.writeFile('../website/public/compiled.json', json, 'utf8');