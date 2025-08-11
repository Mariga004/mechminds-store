"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Category } from "@/types";
import Link from "next/link";

interface MobileNavProps {
  categories: Category[];
}

const MobileNav: React.FC<MobileNavProps> = ({ categories }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-950 shadow-sm transition-colors duration-200 lg:hidden cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <button onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col space-y-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  onClick={() => setOpen(false)}
                  className="text-gray-800 hover:underline"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNav;
