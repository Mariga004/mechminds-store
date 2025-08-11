import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "react-hot-toast";

import { Product } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (data: Product) => void;
  removeItem: (id: string) => void;
  removeAll: () => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  getTotalQuantity: () => number; // ✅ Added
}

const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      addItem: (data: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === data.id);

        if (existingItem) {
          return get().increaseQuantity(data.id);
        }

        set({ items: [...currentItems, { ...data, quantity: 1 }] });
        toast.success("Product added to cart");
      },
      removeItem: (id: string) => {
        set({ items: get().items.filter(item => item.id !== id) });
        toast.success("Product removed from cart");
      },
      removeAll: () => set({ items: [] }),
      increaseQuantity: (id: string) => {
        const updated = get().items.map(item =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: updated });
      },
      decreaseQuantity: (id: string) => {
        const existingItem = get().items.find(item => item.id === id);
        if (existingItem?.quantity === 1) {
          get().removeItem(id);
        } else {
          const updated = get().items.map(item =>
            item.id === id ? { ...item, quantity: item.quantity - 1 } : item
          );
          set({ items: updated });
        }
      },
      getTotalQuantity: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCart;