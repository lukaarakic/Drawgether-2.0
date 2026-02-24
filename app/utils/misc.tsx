export function invariantResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  message: string,
  responseInit?: ResponseInit,
): asserts condition {
  if (!condition) {
    throw new Response(message, { status: 400, ...responseInit });
  }
}

export function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  const maskedUsername =
    username.charAt(0) + "*".repeat(3) + username.charAt(username.length - 1);
  return maskedUsername + "@" + domain;
}
