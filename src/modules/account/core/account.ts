export type Account = {
  name: string;
  email: string;
};

export function displayName({ name, email }: Account) {
  return name.trim() || emailName(email);
}

export function emailName(email: string) {
  const [beforeAt = email] = email.split('@');
  return beforeAt;
}
