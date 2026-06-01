import { PawPrint } from "lucide-react";

export function Header() {
  return (
    <header className="h-12">
      <div className="inline-flex h-10 items-center gap-1.5 rounded-br-lg bg-[#25252e] px-3 text-xs font-bold uppercase text-[#9b87ff] shadow-sm">
        <PawPrint className="size-4" strokeWidth={2.3} />
        <span>MUNDO PET</span>
      </div>
    </header>
  );
}
