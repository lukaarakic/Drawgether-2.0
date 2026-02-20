import Navbar from "@/app/components/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <Navbar username={"Netrunners"} />
      </header>
      <main className="mt-20 flex items-center justify-center md:mt-72">
        {children}
      </main>
    </>
  );
};

export default Layout;
