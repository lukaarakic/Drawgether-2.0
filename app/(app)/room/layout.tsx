import Image from "next/image";
import LeftCloud from "@/app/assets/clouds/left_blue.svg";
import RightCloud from "@/app/assets/clouds/right_blue.svg";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}

      <div>
        <Image
          src={LeftCloud}
          alt="Left corner cloud"
          className="pointer-events-none absolute bottom-0 left-0 w-full xs:w-1/2 lg:w-1/3"
        />
        <Image
          src={RightCloud}
          alt="Right corner cloud"
          className="pointer-events-none absolute bottom-0 right-0 w-full xs:w-1/2 lg:w-1/3"
        />
      </div>
    </div>
  );
};
export default Layout;
