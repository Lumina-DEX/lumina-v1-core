import Chainalysis from "@/services/chainalysis";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  try {
    console.log("/api/chainalysis/register", req.body);
    const { address } = JSON.parse(req.body);

    const chainalysisService = new Chainalysis();
    const response = await chainalysisService.register({ address });

    res.status(200).json({ message: "Success", body: response });
  } catch (error) {
    console.error("/api/chainalysis/register", error);
    res.status(500);
  }
}
