export function canSignalRemovedPasskey() {
  return (
    'PublicKeyCredential' in globalThis &&
    'signalUnknownCredential' in PublicKeyCredential
  );
}

export async function signalRemovedPasskey(credentialId: string) {
  if (!canSignalRemovedPasskey()) return;
  await PublicKeyCredential.signalUnknownCredential({
    rpId: location.hostname,
    credentialId,
  }).catch(() => undefined);
}
