import { Mina, NetworkId, Provable, SmartContract } from 'o1js';
import { PoolFactory, Pool, PoolTokenHolder } from '../index.js';

// node build/src/utils/showVK.js

async function compileAndPrintVKey<T extends typeof SmartContract>(contract: T) {
    const { verificationKey } = await contract.compile();
    const maxNameLength = 24; // 'FarmRewardTokenHolder'.length
    const paddedName = contract.name.padEnd(maxNameLength, ' ');
    Provable.log(`${paddedName}:`, verificationKey.hash);
}

async function compileAndPrintAllVKeys() {
    const allContracts = [
        PoolFactory,
        Pool,
        PoolTokenHolder,
    ];
    for (const contract of allContracts) {
        await compileAndPrintVKey(contract);
    }
}

const networkUrls: Record<string, string> = {
    // Mina networks
    // https://docs.minaprotocol.com/mina-protocol#the-mina-protocol
    // https://docs.minaexplorer.com/minaexplorer/graphql-getting-started
    mainnet: 'https://graphql.minaexplorer.com',
    // https://docs.minaexplorer.com/minaexplorer/berkeley-testnet
    testnet: 'https://berkeley.graphql.minaexplorer.com/',
    // https://docs.minaexplorer.com/minaexplorer/testnet
    devnet: 'https://devnet.graphql.minaexplorer.com/',

    // Zeko networks
    // https://docs.zeko.io/for_end_users#adding-to-auro-wallet
    'zeko:devnet': 'https://devnet.zeko.io/graphql',
};

async function compileAndPrintAllVKeysForAllNetworks() {
    const networkIds: NetworkId[] = [
        { custom: 'local' },
        'testnet',
        'mainnet',
        { custom: 'devnet' },
        { custom: 'zeko:devnet' },
    ];

    for (const networkId of networkIds) {
        let Network;

        const idString = typeof networkId === 'string' ? networkId : networkId.custom;
        if (idString === 'local') {
            Network = await Mina.LocalBlockchain({ proofsEnabled: true });
        } else {
            const graphqlUrl = networkUrls[idString];
            if (!graphqlUrl) {
                console.error(`No GraphQL URL defined for network ${idString}`);
                continue;
            }
            Network = await Mina.Network({
                networkId,
                mina: graphqlUrl,
            });
        }

        Mina.setActiveInstance(Network);
        console.log(`VKey Hashes for network ${idString}:`);
        await compileAndPrintAllVKeys();
        console.log('');
    }
}

compileAndPrintAllVKeysForAllNetworks();
