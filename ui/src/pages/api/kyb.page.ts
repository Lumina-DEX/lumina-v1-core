// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  try {
    console.log("/api/kyb", req.body);

    await supabase.from("logs").insert({
      body: req.body,
    });
    // {
    //   data: {
    //     address: 'B62qoEM26H9XzUhWQxjzpNN4B5ysMdAW7YnbRRbj3M3sStdyn3e8Npc',
    //     verified: true,
    //     mode: true
    //   },
    const {
      data: { mode, address, verified },
    } = JSON.parse(req.body);

    const result = await supabase
      .from("KYBpermissions")
      .update({
        is_verified: verified,
      })
      .eq("wallet_address", address)
      .eq("kyb_mode", mode ? "TESTING" : null);

    if (result.error) {
      throw result.error.message;
    }

    res.status(200).json({ message: "Success" });
  } catch (e) {
    console.error("/api/kyb", e);
    res.status(500);
  }
}
