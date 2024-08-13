import { PrivateKey } from 'o1js';

for (let index = 0; index < 10; index++) {
    const key = PrivateKey.random();

    console.log("key " + index, {
        private: key.toBase58(),
        public: key.toPublicKey().toBase58()
    })
}