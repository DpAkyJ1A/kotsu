import { getCtx } from '@/server/ctx/get-ctx';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  await getCtx();
  return children;
}
