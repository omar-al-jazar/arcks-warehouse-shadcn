"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export type LabelEquipment = {
  id: number;
  barcode: string;
  name: string;
  category: string;
};

function BarcodeLabel({ item }: { item: LabelEquipment }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    JsBarcode(svgRef.current, item.barcode, {
      format: "CODE128",
      width: 1.6,
      height: 36,
      fontSize: 12,
      margin: 4,
      displayValue: true,
    });
  }, [item.barcode]);

  return (
    <div className="label-card flex h-[1in] w-[2.5in] flex-col items-center justify-center gap-0.5 border border-black/20 bg-white px-2 py-1 text-black">
      <p className="w-full truncate text-center text-[11px] font-semibold leading-tight">{item.name}</p>
      <p className="w-full truncate text-center text-[9px] capitalize leading-tight text-black/60">
        {item.category}
      </p>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}

export default function BarcodeLabelSheet({ items }: { items: LabelEquipment[] }) {
  return (
    <div className="label-sheet grid grid-cols-3 gap-3">
      {items.map((item) => (
        <BarcodeLabel key={item.id} item={item} />
      ))}
    </div>
  );
}
