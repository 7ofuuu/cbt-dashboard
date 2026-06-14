"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// Custom time picker (24h) built on the shadcn Popover. Works with a plain
// "HH:mm" string value so it is a drop-in replacement for <input type="time" />.
export function TimePicker({
  value,
  onChange,
  placeholder = "Pilih waktu",
  disabled = false,
  className,
  id,
}) {
  const [open, setOpen] = React.useState(false);
  const [hour, minute] = (value || "").split(":");

  const setHour = (h) => onChange(`${h}:${minute || "00"}`);
  const setMinute = (m) => onChange(`${hour || "00"}:${m}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          {value ? <span className="font-mono">{value} WIB</span> : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex divide-x">
          <TimeColumn
            label="Jam"
            items={HOURS}
            selected={hour}
            onSelect={setHour}
          />
          <TimeColumn
            label="Menit"
            items={MINUTES}
            selected={minute}
            onSelect={setMinute}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({ label, items, selected, onSelect }) {
  const activeRef = React.useRef(null);

  // Keep the currently selected cell in view when the popover opens.
  React.useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "center" });
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground text-center border-b">
        {label}
      </div>
      <div className="h-48 w-16 overflow-y-auto p-1 [scrollbar-width:thin]">
        {items.map((item) => {
          const isActive = item === selected;
          return (
            <button
              key={item}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "w-full rounded-md py-1.5 text-sm font-mono transition-colors",
                isActive
                  ? "bg-sky-800 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
