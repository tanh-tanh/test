'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import type { PuzzleData, Clue } from '@/lib/puzzle';
import { generateGridFromClues } from '@/lib/gridGenerator';
import CrissCrossPuzzle from './CrissCrossPuzzle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const clueSchema = z.object({
    question: z.string().min(1, { message: 'Gợi ý không được để trống.' }),
    answer: z.string().min(2, { message: 'Đáp án cần ít nhất 2 ký tự.' }),
});

const puzzleSchema = z.object({
  title: z.string().min(3, { message: 'Tiêu đề cần ít nhất 3 ký tự.' }),
  clues: z.array(clueSchema).min(2, { message: 'Cần ít nhất 2 cặp gợi ý và đáp án.' }),
});

type PuzzleFormValues = z.infer<typeof puzzleSchema>;

export default function PuzzleCreator() {
  const { toast } = useToast();
  const [generatedPuzzle, setGeneratedPuzzle] = useState<PuzzleData | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PuzzleFormValues>({
    resolver: zodResolver(puzzleSchema),
    defaultValues: {
      title: '',
      clues: [
        { question: '', answer: '' },
        { question: '', answer: '' }
    ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'clues',
  });

  function onSubmit(data: PuzzleFormValues) {
    startTransition(async () => {
        try {
            const answers = data.clues.map(c => c.answer.replace(/\s+/g, '').toUpperCase());
            const puzzleLayout = generateGridFromClues(answers);

            if (!puzzleLayout) {
                toast({
                    title: 'Lỗi tạo ô chữ',
                    description: 'Không thể tạo được một ô chữ hợp lệ với các từ đã cho. Hãy thử lại với các từ khác.',
                    variant: 'destructive',
                });
                setGeneratedPuzzle(null);
                return;
            }

            const clues: Clue[] = puzzleLayout.entries.map((entry) => ({
                id: `${entry.number}${entry.direction === 'across' ? 'a' : 'd'}`,
                number: entry.number,
                question: data.clues[entry.wordIndex].question,
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
            setShowForm(false); // Hide the form on success
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
        }
    });
  }

  return (
    <>
      {showForm && (
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
                  <h3 className="text-lg font-medium">Các Gợi Ý và Đáp Án</h3>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-background/50 space-y-4 relative">
                        <FormField
                            control={form.control}
                            name={`clues.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gợi ý {index + 1}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Vua của muôn loài" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`clues.${index}.answer`}
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
                <Button type="button" variant="outline" onClick={() => append({ question: '', answer: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm Gợi Ý & Đáp Án
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
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
      )}
      
      {generatedPuzzle && (
        <div className="mt-12">
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
