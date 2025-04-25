import { Mina, Provable, UInt32, UInt64 } from 'o1js';

let proofsEnabled = true;

describe('Pool Factory Mina', () => {

    beforeAll(async () => {
        const Network = Mina.Network({
            // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
            // This is to ensure the backward compatibility.
            networkId: "testnet",
            mina: "https://api.minascan.io/node/devnet/v1/graphql",
            archive: "https://api.minascan.io/archive/devnet/v1/graphql",
        });
        Mina.setActiveInstance(Network);
    });

    it('network info', async () => {
        const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
        //const networkState = Mina.activeInstance.getNetworkState();
        Provable.log("genesisTimestamp", genesisTimestamp);
        Provable.log("slotTime", slotTime);
        //Provable.log("networkState", networkState);
        const testSlot = globalSlotToTimestamp(UInt32.from(183157));
        Provable.log("testSlot", testSlot);

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();

        let slotCalculated = getSlotFromTimestamp(tomorrow);
        Provable.log("slotCalculated", slotCalculated);

        const timestampFromslot = globalSlotToTimestamp(slotCalculated);
        Provable.log("timestampFromslot", timestampFromslot);
    });


    function getSlotFromTimestamp(date: number) {
        const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
        let slotCalculated = UInt64.from(date);
        slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
        Provable.log("slotCalculated64", slotCalculated);
        return slotCalculated.toUInt32();
    }

    function globalSlotToTimestamp(slot: UInt32) {
        let { genesisTimestamp, slotTime } =
            Mina.activeInstance.getNetworkConstants();
        return UInt64.from(slot).mul(slotTime).add(genesisTimestamp);
    }

});