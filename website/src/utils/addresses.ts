export const poolToka = "B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK";
//export const poolWeth = "B62qphnhqrRW6DFFR39onHNKnBcoB9Gqi3M8Emytg26nwZWUYXR1itw";

export class Addresses {
    private static list = [];

    public static async getList() {
        if (Addresses.list.length) {
            return Addresses.list;
        }
        const listToken = await fetch('/token-list.json');
        const data = await listToken.json();
        Addresses.list = data;
        return Addresses.list;
    }
}
