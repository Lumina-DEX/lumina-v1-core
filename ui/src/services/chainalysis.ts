export default class Chainalysis {
  private chainalysisUrl;
  private apiKey;

  constructor() {
    this.chainalysisUrl = process.env.NEXT_PUBLIC_CHAINALYSIS_URL;
    this.apiKey = process.env.NEXT_PUBLIC_CHAINALYSIS_API_KEY;
  }

  async register(req: { address: string }) {
    if (!this.chainalysisUrl) {
      throw new Error("NEXT_PUBLIC_CHAINALYSIS_URL is missing in env");
    }
    if (!this.apiKey) {
      throw new Error("NEXT_PUBLIC_CHAINALYSIS_API_KEY is missing in env");
    }

    const { address } = req;
    if (!address) {
      throw new Error("Address cannot be null");
    }

    const response = await (
      await fetch(`${this.chainalysisUrl}/v2/entities`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Token: this.apiKey,
        },
        body: JSON.stringify({ address }),
      })
    ).json();

    return response;
  }

  async retrieve(req: { address: string }) {
    if (!this.chainalysisUrl) {
      throw new Error("NEXT_PUBLIC_CHAINALYSIS_URL is missing in env");
    }
    if (!this.apiKey) {
      throw new Error("NEXT_PUBLIC_CHAINALYSIS_API_KEY is missing in env");
    }

    const { address } = req;
    if (!address) {
      throw new Error("Address cannot be null");
    }

    const response = await (
      await fetch(`${this.chainalysisUrl}/v2/entities/${address}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Token: this.apiKey,
        },
      })
    ).json();

    return response;
  }
}
