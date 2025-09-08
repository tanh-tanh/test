import { Header } from '@/components/Header';
import PuzzleCreator from '@/components/game/PuzzleCreator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatePuzzlePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary font-headline">Tạo Ô Chữ Mới</CardTitle>
                <CardDescription>Điền các câu hỏi và đáp án bằng tiếng Việt để tạo ra ô chữ của riêng bạn.</CardDescription>
            </CardHeader>
            <CardContent>
                <PuzzleCreator />
            </CardContent>
        </Card>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>Chia sẻ ô chữ của bạn với bạn bè và gia đình!</p>
      </footer>
    </div>
  );
}
