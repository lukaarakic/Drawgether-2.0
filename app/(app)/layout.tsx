import Navbar from "@/app/components/Navbar";
import { getArtist, logout } from "@/app/lib/auth-utils";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const artist = await getArtist();

  if (!artist) {
    await logout();
    redirect("/login");
  }

  return (
    <>
      <header>
        <Navbar username={artist.username} />
      </header>
      <main className="min-h-dvh flex items-center justify-center">
        {children}
      </main>
    </>
  );
};

export default Layout;
