import Navbar from "@/app/components/Navbar";
import { getArtist } from "@/app/lib/auth-utils";
import { redirect } from "next/navigation";
import { NavbarProvider } from "../context/NavbarContext";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const artist = await getArtist();

  if (!artist) {
    redirect("/login");
  }

  return (
    <>
      <NavbarProvider>
        <header>
          <Navbar username={artist.username} />
        </header>
        <main className="min-h-dvh flex justify-center">{children}</main>
      </NavbarProvider>
    </>
  );
};

export default Layout;
