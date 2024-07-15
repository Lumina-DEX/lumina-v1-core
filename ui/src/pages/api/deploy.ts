import { Pool } from "../../../../contracts/build/src";

const pool = Pool.compile();

export async function POST(
    req: Request
) {
    const json = await req.json();

}
