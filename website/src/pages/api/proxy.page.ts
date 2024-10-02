import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = "https://devnet.minaprotocol.network/graphql"; // The actual URL of your API

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  // console.log("req", req.body);
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: req.body,
  });
  console.log("response", response);
  const result = await response.body;
  console.log("result", result);
  res.status(200).json(result);
}
