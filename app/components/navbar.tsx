import Link from "next/link";
import Container from "./ui/container";
import MainNav from "./main-nav";
import getCategories from "@/actions/get-categories";
import NavbarActions from "./navbar-actions";
import MobileNav from "./mobile-nav"; 

export const revalidate = 0;

const Navbar = async () => {
  const categories = await getCategories();

  return (
    <div className="fixed top-0 w-full z-50 bg-white border-b shadow-sm">
      <Container>
        <div className="relative px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-x-4">
            <MobileNav categories={categories} />
            <Link href="/" className="ml-4 flex lg:ml-0 gap-x-2">
              <p className="font-bold text-xl">ELIMU ROBOTICS</p>
            </Link>
            <div className="hidden lg:block">
              <MainNav data={categories} />
            </div>
          </div>

          <div className="flex items-center gap-x-4">
            <NavbarActions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
