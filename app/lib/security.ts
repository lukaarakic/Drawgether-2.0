export function validateHoneypot(formData: FormData): boolean {
  const field = formData.get("hp_email");
  return field === "" || field === null;
}
