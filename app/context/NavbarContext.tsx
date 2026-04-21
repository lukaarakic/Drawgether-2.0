"use client";
import { createContext, useContext, useState } from "react";

const NavbarContext = createContext<{
  hidden: boolean;
  setHidden: (v: boolean) => void;
}>({ hidden: false, setHidden: () => {} });

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return (
    <NavbarContext.Provider value={{ hidden, setHidden }}>
      {children}
    </NavbarContext.Provider>
  );
}

export const useNavbar = () => useContext(NavbarContext);
