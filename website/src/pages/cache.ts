// Importing 'crypto' module
// import crypto from 'crypto';

export const fetchFiles = async () => {
    let currentLocation = self.location.origin;
    var headers = new Headers();
    headers.append('Content-Encoding', 'br, gzip, deflate');

    const filesResponse = await fetch(`${currentLocation}/compiled.json`, { headers });
    const json = await filesResponse.json();
    return Promise.all(json.map((file) => {
        return Promise.all([
            fetch(`${currentLocation}/cache/${file}.txt`, {
                cache: "force-cache",
                headers
            }).then(res => res.text())
        ]).then(([data]) => ({ file, data }));
    }))
        .then((cacheList) => cacheList.reduce((acc: any, { file, data }) => {
            acc[file] = { file, data };

            return acc;
        }, {}));
}

export const readCache = (files: any): any => ({
    read({ persistentId, uniqueId, dataType }: any) {
        // read current uniqueId, return data if it matches
        if (!files[persistentId]) {
            console.log("not found : ", persistentId);
            return undefined;
        }

        if (dataType === 'string') {
            const data = files[persistentId].data;
            // const hash = crypto.createHash('sha1').update(data).digest('hex');
            // console.log(persistentId + " hash", hash);
            return new TextEncoder().encode(data);
        }
        // else {
        //   let buffer = readFileSync(resolve(cacheDirectory, persistentId));
        //   return new Uint8Array(buffer.buffer);
        // }
        console.log("data type not string : ", persistentId);
        return undefined;
    },
    write({ persistentId, uniqueId, dataType }: any, data: any) {
        console.log('write');
        console.log({ persistentId, uniqueId, dataType });
    },
    canWrite: false,
});