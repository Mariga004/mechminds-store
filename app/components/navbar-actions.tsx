"use client"

import { ShoppingCart, UserCircle, PackageCheck } from "lucide-react";
import Button from "./ui/button";
import { useEffect, useState } from "react";
import useCart from "@/hooks/use-cart";
import { useRouter } from "next/navigation";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'


const NavbarActions = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const router = useRouter();
    const cart = useCart();

    if (!isMounted) {
        return null;
    }
    return (
        <div className="ml-auto flex items-center gap-x-6">
            <Button
                onClick={() => router.push("/cart")}
                className="flex flex-col items-center justify-center bg-transparent shadow-none p-0 cursor-pointer"
                >
                <div className="relative">
                    <ShoppingCart size={24} color="black" />
                    {cart.items.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                        {cart.items.length}
                    </span>
                    )}
                </div>
            </Button>

            <Button
            onClick={() => router.push("/orders")}
            className="flex flex-col items-center justify-center bg-transparent shadow-none p-0 cursor-pointer"
            >
                <PackageCheck size={24} color="black" />
            </Button>

            <SignedOut>
            <SignInButton mode="modal">
                <button className="flex flex-col items-center justify-center cursor-pointer bg-transparent p-0">
                  <UserCircle size={24} className="text-black" />
                </button>
            </SignInButton>
            </SignedOut>
            <SignedIn>
            <div className="flex flex-col items-center justify-center">
                <UserButton afterSignOutUrl="/" />
            </div>
            </SignedIn>

        </div>
    );
}

export default NavbarActions;