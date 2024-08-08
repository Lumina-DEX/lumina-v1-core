import { v4 as uuidv4 } from "uuid";

export default class ZKPid {
  private zkPidAuthUrl;
  private zkPidMainUrl;
  private customerId;
  private secretKey;

  private token;

  constructor() {
    this.zkPidAuthUrl = process.env.NEXT_PUBLIC_ZKPID_AUTH_URL;
    this.zkPidMainUrl = process.env.NEXT_PUBLIC_ZKPID_URL;
    this.customerId = process.env.NEXT_PUBLIC_ZKPID_CUSTOMER_ID;
    this.secretKey = process.env.NEXT_PUBLIC_ZKPID_SECRET_KEY;
    this.token = "";
  }

  async login() {
    if (!this.zkPidAuthUrl) {
      throw new Error("ZKPID_AUTH_URL is missing in env");
    }
    if (!this.customerId) {
      throw new Error("ZKPID_CUSTOMER_ID is missing in env");
    }
    if (!this.secretKey) {
      throw new Error("ZKPID_SECRET_KEY is missing in env");
    }

    const { token } = await (
      await fetch(`${this.zkPidAuthUrl}/papi/auth`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: this.customerId,
          secret_key: this.secretKey,
        }),
      })
    ).json();
    this.token = token;
  }

  async startkyc(req: { address: string; mode: boolean }) {
    if (!this.zkPidMainUrl) {
      throw new Error("ZKPID_URL is missing in env");
    }
    if (!this.token) {
      throw new Error("Login to ZKPID_AUTH_URL first");
    }

    const { url } = await (
      await fetch(`${this.zkPidMainUrl}/v1/api/startkyc`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Token": this.token,
        },
        body: JSON.stringify({
          uid: uuidv4(),
          address: req.address,
          dummyStatus: req.mode ? "APPROVED" : undefined,
        }),
      })
    ).json();
    return url;
  }
}
