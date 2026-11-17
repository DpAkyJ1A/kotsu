export type Account = {
  name: string;
  email: string;
};

export function displayName({ name, email }: Account) {
  const [emailName = email] = email.split('@');
  return name.trim() || emailName;
}
