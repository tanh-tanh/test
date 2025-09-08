import { Header } from '@/components/Header';
import CrissCrossPuzzle from '@/components/game/CrissCrossPuzzle';
import { samplePuzzle } from '@/lib/puzzle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-2 sm:p-4 md:p-8">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-primary tracking-wider font-headline">
              {samplePuzzle.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrissCrossPuzzle puzzleData={samplePuzzle} />
          </CardContent>
        </Card>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>Tạo bởi Firebase Studio. Một trò chơi ô chữ vui vẻ.</p>
      </footer>
    </div>
  );
}
