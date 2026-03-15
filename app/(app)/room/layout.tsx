import Image from "next/image";
import LeftCloud from "@/app/assets/clouds/left_blue.svg";
import RightCloud from "@/app/assets/clouds/right_blue.svg";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="pb-40 lg:mt-80">
      {children}

      <div>
        <Image
          src={LeftCloud}
          alt="Left corner cloud"
          className="pointer-events-none fixed bottom-0 left-0 w-full xs:w-1/2 lg:w-1/3 hidden 2xl:block"
        />
        <Image
          src={RightCloud}
          alt="Right corner cloud"
          className="pointer-events-none fixed bottom-0 right-0 w-full xs:w-1/2 lg:w-1/3 hidden 2xl:block"
        />
      </div>
    </div>
  );
};
export default Layout;
