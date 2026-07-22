const uuid = () => crypto.randomUUID();
/** Browser-only anonymous identity; never accepts a member record or contact data. */
export function createAnonymousIdentity(storage = globalThis.sessionStorage) {
  const key = "bomsociety.analytics.anonymous-id";
  let anonymousId = storage?.getItem(key);
  if (!anonymousId) { anonymousId = uuid(); storage?.setItem(key, anonymousId); }
  return Object.freeze({ anonymousId, sessionId: uuid() });
}
/** Identity service boundary: opaque verification reference only, never an analytics identifier. */
export function createVerifiedMemberRecord({ memberId, verifiedAt = new Date().toISOString(), verificationMethod }) {
  if (!memberId || !verificationMethod) throw new TypeError("memberId and verificationMethod are required in the identity domain");
  return Object.freeze({ memberId, verifiedAt, verificationMethod });
}
/** Event actor intentionally exposes no member identifier. */
export function analyticsActor(identity, isVerified = false) {
  return Object.freeze({ kind: isVerified ? "verified_member" : "anonymous", anonymousId: identity.anonymousId });
}
