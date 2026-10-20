interface PolicyOptions {
  dev: boolean;
  /** Firebase Auth domain; its sign-in helper page is loaded in an iframe. */
  authDomain?: string;
}

/**
 * Content-Security-Policy for HTML responses. Scripts and styles run only with the
 * per-request nonce; 'strict-dynamic' lets those trusted scripts load their own chunks.
 */
export function buildPolicy(nonce: string, { dev, authDomain }: PolicyOptions): string {
  const auth = authDomain ? ` https://${authDomain}` : "";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Dev mode injects styles for fast refresh without a nonce.
    `style-src 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    `frame-src https://accounts.google.com${auth}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
