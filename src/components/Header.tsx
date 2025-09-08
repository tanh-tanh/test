import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Puzzle, PenSquare } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
            <Puzzle className="text-primary w-8 h-8 transition-transform group-hover:rotate-12" />
            <h1 className="text-2xl font-bold text-primary font-headline tracking-tight">Ô Chữ Vui</h1>
        </Link>
        <nav>
          <Button asChild variant="ghost" className="hover:bg-primary/10">
            <Link href="/create">
              <PenSquare className="mr-2 h-4 w-4" />
              Tạo Ô Chữ
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
