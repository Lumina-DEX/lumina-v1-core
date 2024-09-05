import {
    Cache,
} from "o1js";

export const fetchFiles = async () => {
    let currentLocation = self.location.origin;
    const filesResponse = await fetch(`${currentLocation}/compiled.json`);
    const json = await filesResponse.json();
    return Promise.all(json.map((file) => {
        var headers = new Headers();
        headers.append('Accept-Encoding', 'gzip, deflate, br');
        return Promise.all([
            fetch(`${currentLocation}/cache/${file}`, {
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

export const readCache = (files: any): Cache => ({
    read({ persistentId, uniqueId, dataType }: any) {
        // read current uniqueId, return data if it matches
        if (!files[persistentId]) {
            return undefined;
        }

        if (dataType === 'string') {
            return new TextEncoder().encode(files[persistentId].data);
        }
        // else {
        //   let buffer = readFileSync(resolve(cacheDirectory, persistentId));
        //   return new Uint8Array(buffer.buffer);
        // }

        return undefined;
    },
    write({ persistentId, uniqueId, dataType }: any, data: any) {
        console.log('write');
        console.log({ persistentId, uniqueId, dataType });
    },
    canWrite: true,
});