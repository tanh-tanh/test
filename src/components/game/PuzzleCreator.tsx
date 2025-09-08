'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Wand2, Sparkles, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useState, useTransition } from 'react';
import type { PuzzleData, Clue } from '@/lib/puzzle';
import { generateGridFromClues } from '@/lib/gridGenerator';
import CrissCrossPuzzle from './CrissCrossPuzzle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generatePuzzleCluesAction } from '@/app/actions';

const puzzleSchema = z.object({
  title: z.string().min(3, { message: 'Tiêu đề cần ít nhất 3 ký tự.' }),
  answers: z.array(z.string().min(2, { message: 'Đáp án cần ít nhất 2 ký tự.' })).min(2, { message: 'Cần ít nhất 2 đáp án.' }),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function PuzzleCreator() {
  const { toast } = useToast();
  const [generatedPuzzle, setGeneratedPuzzle] = useState<PuzzleData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: {
      title: '',
      answers: ['', ''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'answers',
  });

  const generateClues = () => {
    const answers = form.getValues('answers').filter(a => a.length >= 2);
    if (answers.length < 2) {
      toast({
        title: 'Chưa đủ đáp án',
        description: 'Vui lòng nhập ít nhất 2 đáp án hợp lệ để tạo gợi ý.',
        variant: 'destructive',
      });
      return;
    }
    
    startTransition(async () => {
      setIsGenerating(true);
      const result = await generatePuzzleCluesAction({ answers });
      if (result.success) {
        // This is a placeholder, a real implementation would update a form state
        toast({
            title: 'Gợi ý đã được tạo!',
            description: 'AI đã tạo ra các gợi ý cho đáp án của bạn.'
        })
        console.log(result.data.clues);
      } else {
        toast({
          title: 'Lỗi tạo gợi ý',
          description: result.data.clues.join('\n') || 'Không thể tạo gợi ý từ AI.',
          variant: 'destructive',
        });
      }
      setIsGenerating(false);
    });
  };

  function onSubmit(data: PuzzleFormValues) {
    setIsGenerating(true);
    startTransition(async () => {
        try {
            const cleanedAnswers = data.answers.map(a => a.replace(/\s+/g, '').toUpperCase());
            const cluesResult = await generatePuzzleCluesAction({ answers: cleanedAnswers });

            if (!cluesResult.success) {
                toast({
                    title: 'Lỗi tạo gợi ý',
                    description: 'Không thể tạo gợi ý cho ô chữ. Vui lòng thử lại.',
                    variant: 'destructive',
                });
                setIsGenerating(false);
                return;
            }

            const puzzleLayout = generateGridFromClues(cleanedAnswers);

            if (!puzzleLayout) {
                toast({
                    title: 'Lỗi tạo ô chữ',
                    description: 'Không thể tạo được một ô chữ hợp lệ với các từ đã cho. Hãy thử lại với các từ khác.',
                    variant: 'destructive',
                });
                setGeneratedPuzzle(null);
                setIsGenerating(false);
                return;
            }

            const clues: Clue[] = puzzleLayout.entries.map((entry) => ({
                id: `${entry.number}${entry.direction === 'across' ? 'a' : 'd'}`,
                number: entry.number,
                question: cluesResult.data.clues[entry.wordIndex] || '...gợi ý đang được tạo...',
                answer: entry.word,
                direction: entry.direction,
                row: entry.y,
                col: entry.x,
            }));
            
            const newPuzzle: PuzzleData = {
                id: `custom-${Date.now()}`,
                title: data.title,
                clues,
                gridSize: { rows: puzzleLayout.height, cols: puzzleLayout.width },
                solutionGrid: puzzleLayout.grid,
            };

            setGeneratedPuzzle(newPuzzle);
            toast({
                title: 'Tuyệt vời!',
                description: 'Ô chữ của bạn đã được tạo. Bạn có thể xem trước nó bên dưới.',
            });

        } catch (error) {
            console.error(error);
            toast({
                title: 'Đã xảy ra lỗi',
                description: 'Có lỗi xảy ra trong quá trình tạo ô chữ.',
                variant: 'destructive',
            });
            setGeneratedPuzzle(null);
        } finally {
            setIsGenerating(false);
        }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Tiêu đề Ô chữ</FormLabel>
                <FormControl>
                  <Input placeholder="Ví dụ: Động vật hoang dã" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Các đáp án</h3>
                <Button type="button" variant="outline" size="sm" onClick={generateClues} disabled={isPending || isGenerating}>
                    <BrainCircuit />
                    Tạo gợi ý bằng AI
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Nhập các đáp án. AI sẽ tự động tạo câu hỏi gợi ý cho bạn khi bạn nhấn nút "Tạo Ô Chữ".
              </p>
              {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg bg-background/50 space-y-4 relative">
                      <FormField
                      control={form.control}
                      name={`answers.${index}`}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Đáp án {index + 1}</FormLabel>
                          <FormControl>
                              <Input placeholder="Ví dụ: Sư tử" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      {fields.length > 2 && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                  </div>
              ))}
          </div>

          <div className="flex flex-wrap gap-4 items-center">
              <Button type="button" variant="outline" onClick={() => append('')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm đáp án
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button type="submit" disabled={isPending || isGenerating}>
                {isPending || isGenerating ? (
                    <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                    </>
                ) : (
                    <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Tạo Ô Chữ
                    </>
                )}
              </Button>
          </div>
        </form>
      </Form>
      
      {generatedPuzzle && (
        <div className="mt-12 pt-8 border-t">
            <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-bold text-primary tracking-wider font-headline">
                    {generatedPuzzle.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CrissCrossPuzzle puzzleData={generatedPuzzle} />
                </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}
