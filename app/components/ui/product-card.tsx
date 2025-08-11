"use client";

import { Product } from "@/types";
import Image from "next/image";
import IconButton from "./icon-button";
import { Expand, ShoppingCart } from "lucide-react";
import Currency from "./currency";
import { useRouter } from "next/navigation";
import { MouseEventHandler } from "react";
import usePreviewModal from "@/hooks/use-preview-modal";
import useCart from "@/hooks/use-cart";

interface ProductCardProps {
  data: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ data }) => {
  const cart = useCart();
  const previewModal = usePreviewModal();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/product/${data?.id}`);
  };

  const onPreview: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    previewModal.onOpen(data);
  };

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    cart.addItem(data);
  };

  return (
    <div
      onClick={handleClick}
      className="w-[160px] bg-white group cursor-pointer rounded-lg border p-2 space-y-3"
    >
      <div className="aspect-square rounded-md bg-gray-100 relative">
        <Image
          src={data.images[0].url}
          fill
          alt="Product Image"
          className="object-cover rounded-md"
        />
        <div className="opacity-0 group-hover:opacity-100 transition absolute w-full px-3 bottom-2">
          <div className="flex gap-x-3 justify-center">
            <IconButton
              onClick={onPreview}
              icon={<Expand size={18} className="text-gray-600" />}
            />
            <IconButton
              onClick={onAddToCart}
              icon={<ShoppingCart size={18} className="text-gray-600" />}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-xs text-gray-500">{data.category?.name}</p>
      </div>

      <div className="text-sm font-semibold">
        <Currency value={data?.price} />
      </div>
    </div>
  );
};

export default ProductCard;
