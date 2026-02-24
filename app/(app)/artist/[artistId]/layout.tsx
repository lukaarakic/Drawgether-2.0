export default function ArtistLayout({
  children,
  modal,
  settings,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  settings: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
      {settings}
    </>
  );
}
