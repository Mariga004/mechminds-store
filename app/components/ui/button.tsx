import { cn } from "@/lib/utils";
import { propagateServerField } from "next/dist/server/lib/render-server";
import { forwardRef } from "react";

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button= forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    children,
    disabled,
    type = "button",
    ...props
}, ref ) => {
    return (
        <button
            className={cn(
                `
                w-auto
                rounded-full
                bg-black
                border-transparent
                px-3
                py-1.5
                text-sm
                disabled:cursor-not-allowed
                disabled:opacity-50
                text-white
                font-semibold
                hover:opacity-80
                transition
                flex
                justify-center
                items-center
                gap-1.5
                `,
                className
            )}
            disabled={disabled}
            ref={ref}
            {...props}
            >
                {children}
        </button>
    )
});

Button.displayName = "Button";

export default Button