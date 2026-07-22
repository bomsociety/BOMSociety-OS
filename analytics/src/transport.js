/** Transport interface: implement send(events) without coupling collection to a vendor. */
export class EventTransport { async send(_events) { throw new Error("EventTransport.send must be implemented"); } }
export class HttpEventTransport extends EventTransport {
  constructor(endpoint, fetchImpl = globalThis.fetch) { super(); this.endpoint = endpoint; this.fetchImpl = fetchImpl; }
  async send(events) {
    const response = await this.fetchImpl(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ events }) });
    if (!response.ok) throw new Error(`analytics transport failed: ${response.status}`);
    return response;
  }
}
export class MemoryEventTransport extends EventTransport { constructor() { super(); this.events = []; } async send(events) { this.events.push(...events); } }
