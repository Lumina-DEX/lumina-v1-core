import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey } from 'o1js';
import { mulDiv } from './indexmina.js';


export function getAmountOut(amountIn: number, balanceIn: number, balanceOut: number, percent: number) {

    const balanceInMax = balanceIn + balanceIn * percent / 100;
    const balanceOutMin = balanceOut - balanceOut * percent / 100;

    const amountOut = Math.trunc(balanceOutMin * amountIn / (balanceInMax + amountIn));

    return { amountIn, amountOut, balanceOutMin, balanceInMax };
}


export function getAmountOutUint(amountIn: UInt64, balanceIn: UInt64, balanceOut: UInt64, percent: UInt64) {

    const balanceInMax = balanceIn.add(mulDiv(balanceIn, percent, UInt64.from(100)));
    const balanceOutMin = balanceOut.add(mulDiv(balanceOut, percent, UInt64.from(100)));

    const amountOut = mulDiv(balanceOutMin, amountIn, balanceInMax.add(amountIn));

    return { amountIn, amountOut, balanceOutMin, balanceInMax };
}

export function getAmountLiquidityOut(amountAIn: number, balanceA: number, balanceB: number, supply: number, percent: number) {

    const balanceAMax = balanceA + balanceA * percent / 100;
    const balanceBMax = balanceB + balanceB * percent / 100;
    const supplyMin = supply - supply * percent / 100;

    const liquidityA = Math.trunc(amountAIn * supplyMin / balanceAMax);
    const amountBIn = Math.trunc(liquidityA * balanceBMax / supplyMin);
    const liquidityB = Math.trunc(amountBIn * supplyMin / balanceBMax);

    const liquidity = Math.min(liquidityA, liquidityB);

    return { amountAIn, amountBIn, balanceAMax, balanceBMax, supplyMin, liquidity };
}


export function getAmountOutFromLiquidity(liquidity: number, balanceA: number, balanceB: number, supply: number, percent: number) {

    const balanceAMin = balanceA - balanceA * percent / 100;
    const balanceBMin = balanceB - balanceB * percent / 100;
    const supplyMax = supply + supply * percent / 100;

    const amountAOut = Math.trunc(liquidity * balanceAMin / supplyMax);
    const amountBOut = Math.trunc(liquidity * balanceBMin / supplyMax);

    return { amountAOut, amountBOut, balanceAMin, balanceBMin, supplyMax, liquidity };
}
