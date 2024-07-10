import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// actual repository
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// the file to patch
const filePath = path.join(__dirname, './node_modules/o1js/dist/node/lib/mina/constants.js');

// new value
const newValue = 'TransactionCost.COST_LIMIT = 1000;';

// read the file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Read error : ${err}`);
        return;
    }

    // comment the actual value and add the new value
    const result = data.replace(/(TransactionCost\.COST_LIMIT.*)/g, `//$1\n${newValue}`);

    // overwrite the file
    fs.writeFile(filePath, result, 'utf8', (err) => {
        if (err) {
            console.error(`Write error : ${err}`);
            return;
        }
        console.log('Successfully replaced.');
    });
});
