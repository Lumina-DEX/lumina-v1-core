import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey } from 'o1js';
import { mulDiv } from './MathLibrary';


export function getAmountOut(amountIn: number, balanceIn: number, balanceOut: number, percent: number) {

    const balanceInMax = balanceIn + balanceIn * percent / 100;
    const balanceOutMin = balanceOut - balanceOut * percent / 100;

    const amountOut = balanceOutMin * amountIn / (balanceInMax + amountIn);

    return { amountIn, amountOut, balanceOutMin, balanceInMax };
}


export function getAmountOutUint(amountIn: UInt64, balanceIn: UInt64, balanceOut: UInt64, percent: UInt64) {

    const balanceInMax = balanceIn.add(mulDiv(balanceIn, percent, UInt64.from(100)));
    const balanceOutMin = balanceOut.add(mulDiv(balanceOut, percent, UInt64.from(100)));

    const amountOut = mulDiv(balanceOutMin, amountIn, balanceInMax.add(amountIn));

    return { amountIn, amountOut, balanceOutMin, balanceInMax };
}