import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { code } = req.body;
  const resp = await fetch(
    `https://sandbox.orcid.org/oauth/token?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&client_secret=${process.env.NEXT_PUBLIC_ORCID_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=http://localhost:3000/orcid/capture`,
    {
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  const body = await resp.json();
  console.log("got resp", body);

  return res.status(200).json(body);
}
