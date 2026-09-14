export function PulseBar({ width = "w-40" }: { width?: string }) {
  return (
    <div className={`relative h-1 ${width} overflow-hidden rounded-full bg-[#E5DECB]`}>
      <span className="absolute inset-y-0 w-1/3 rounded-full bg-[#A8752E] animate-[bar-slide_1.1s_ease-in-out_infinite]" />
    </div>
  );
}