// src/components/SweetCard.jsx
import React from "react";
import { useCart } from "../context/CartContext";

export default function SweetCard({ item, onOpenQuantity, isProcessing }) {
  const { addItem } = useCart();

  return (
    <article className="bg-white rounded-lg shadow-card hover:shadow-lg transition p-4 flex flex-col">
      <div className="relative">
        <img
          src={item.image || "https://via.placeholder.com/600x400?text=Sweet"}
          alt={item.name}
          className="w-full h-44 object-cover rounded-md"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-medium">
          {item.category || "Other"}
        </div>
      </div>

      <div className="flex-1 mt-3">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{item.description || "No description."}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Price</div>
          <div className="font-semibold text-lg">₹{item.price}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addItem(item, 1)}
            className="px-3 py-2 rounded-md border hover:bg-gray-50"
            title="Add to cart"
          >
            + Cart
          </button>

          <button
            onClick={() => onOpenQuantity && onOpenQuantity(item)}
            disabled={isProcessing}
            className={
              "px-3 py-2 rounded-md transition " +
              (isProcessing ? "bg-gray-300 text-gray-700 cursor-not-allowed" : "bg-brand-500 text-white hover:bg-brand-600")
            }
            aria-label={`Buy ${item.name}`}
          >
            {isProcessing ? "Processing..." : "Buy"}
          </button>
        </div>
      </div>
    </article>
  );
}