// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import jwt_decode from "jwt-decode";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  try {
    console.log("/api/kyc", req.body);

    await supabase.from("logs").insert({
      body: JSON.stringify(req.body),
    });

    const { data } = req.body;
    if (data && "jwt" in data && "kyc_status" in data && "signid" in data) {
      // {
      //   "data": {
      //       "error": 0,
      //       "kyc_status": "APPROVED",
      //       "kyc_mode": "TESTING",
      //       "jwt": "eyJ0eXAiOiJKV1Q.....",
      //       "signid": [
      //           "2c8f52d4-6080-4b4a-85b9-82d0b94993d7"
      //       ]
      //   }
      // }
      const { error, kyc_status, kyc_mode, jwt, signid } = data;

      if (error) {
        throw error;
      }

      const decodedJwt: any = jwt_decode(jwt);
      const credentialSubject =
        decodedJwt.verifiableCredential[0].credentialSubject;
      const walletAddress = credentialSubject["wallet-address"];
      const nationality = credentialSubject["nationality"];

      const result = await supabase.from("KYCpermissions").insert({
        jwt,
        wallet_address: walletAddress,
        nationality,
        kyc_status,
        kyc_mode,
        claim_status: "UNCLAIMED",
      });

      res.status(200).json({ message: "success", result });
    } else if (data && "jwt" in data && "kyc_credential_status" in data) {
      // {
      //   data: {
      //     wallet_address: <wallet address>,
      //     kyc_credential_status: 'CLAIMED'
      //     jwt: 'etbve...'
      //   }
      // }
      const { wallet_address, kyc_credential_status, jwt } = data;

      const result = await supabase
        .from("KYCpermissions")
        .update({
          claim_status: kyc_credential_status,
        })
        .eq("wallet_address", wallet_address)
        .eq("jwt", jwt);

      res.status(200).json({ message: "success", result });
    }
  } catch (e) {
    console.error("/api/kyc", e);
    res.status(500);
  }
}
