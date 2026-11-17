export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="grid w-full max-w-sm gap-8">{children}</div>
    </main>
  );
}
