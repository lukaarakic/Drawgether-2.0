import Navbar from "@/app/components/Navbar";
import { getArtist, logout } from "@/app/lib/auth-utils";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const artist = await getArtist();

  if (!artist) {
    return logout();
  }

  return (
    <>
      <header>
        <Navbar username={artist.username} />
      </header>
      <main className="mt-20 flex items-center justify-center md:mt-72">
        {children}
      </main>
    </>
  );
};

export default Layout;
