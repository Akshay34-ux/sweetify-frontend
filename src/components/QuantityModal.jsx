// src/components/QuantityModal.jsx
import React, { useEffect, useState } from "react";

export default function QuantityModal({ open, onClose, onConfirm, defaultQty = 1 }) {
  const [qty, setQty] = useState(defaultQty);
  useEffect(() => {
    if (open) setQty(defaultQty);
  }, [open, defaultQty]);

  if (!open) return null;

  const inc = () => setQty((q) => q + 1);
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const onChange = (e) => setQty(Math.max(1, Number(e.target.value) || 1));

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Select quantity</h3>

        <div className="flex items-center justify-center gap-3">
          <button onClick={dec} className="px-3 py-2 border rounded-full">−</button>
          <input
            type="number"
            value={qty}
            onChange={onChange}
            min="1"
            className="w-20 text-center px-2 py-2 border rounded"
            aria-label="Quantity"
          />
          <button onClick={inc} className="px-3 py-2 border rounded-full">+</button>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={() => onConfirm(qty)} className="px-4 py-2 rounded bg-brand-500 text-white hover:bg-brand-600">Buy {qty}</button>
        </div>
      </div>
    </div>
  );
}