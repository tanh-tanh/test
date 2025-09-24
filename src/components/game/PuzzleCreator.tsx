'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Wand2, Sparkles, Gift, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import type { PuzzleData, Clue, LuckyWheelReward } from '@/lib/puzzle';
import { generateGrid } from '@/lib/gridGenerator';
import CrissCrossPuzzle from './CrissCrossPuzzle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { samplePuzzle } from '@/lib/puzzle';

const acrossClueSchema = z.object({
    question: z.string().min(1, { message: 'Gợi ý không được để trống.' }),
    answer: z.string().min(2, { message: 'Đáp án cần ít nhất 2 ký tự.' }),
});

const rewardSchema = z.object({
    text: z.string().min(1, { message: 'Phần thưởng không được để trống.' }),
});

const puzzleSchema = z.object({
  title: z.string().min(3, { message: 'Tiêu đề cần ít nhất 3 ký tự.' }),
  keyword: z.string().min(3, { message: 'Từ khóa cần ít nhất 3 ký tự.'}),
  acrossClues: z.array(acrossClueSchema).min(1, { message: 'Cần ít nhất 1 câu đố hàng ngang.' }),
  rewards: z.array(rewardSchema).min(2, { message: 'Cần ít nhất 2 phần thưởng.' }).max(12, {message: 'Tối đa 12 phần thưởng.'}),
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
      keyword: '',
      acrossClues: [
        { question: '', answer: '' },
      ],
      rewards: samplePuzzle.rewards,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'acrossClues',
  });

  const { fields: rewardFields, append: appendReward, remove: removeReward } = useFieldArray({
    control: form.control,
    name: 'rewards',
  });

  function onSubmit(data: PuzzleFormValues) {
    startTransition(async () => {
        try {
            const keyword = data.keyword.replace(/\s+/g, '').toUpperCase();
            const acrossWords = data.acrossClues.map(c => c.answer.replace(/\s+/g, '').toUpperCase());
            
            const puzzleLayout = generateGrid(keyword, acrossWords);

            if (!puzzleLayout) {
                toast({
                    title: 'Lỗi tạo ô chữ',
                    description: 'Không thể tạo được một ô chữ hợp lệ với các từ đã cho. Hãy thử lại với các từ khác hoặc thay đổi thứ tự của chúng.',
                    variant: 'destructive',
                });
                setGeneratedPuzzle(null);
                return;
            }
            
            const clues: Clue[] = puzzleLayout.entries.map((entry) => {
                const isKeyword = entry.direction === 'down';
                const question = isKeyword ? '' : data.acrossClues[entry.wordIndex].question;

                return {
                    id: `${entry.number}${entry.direction === 'across' ? 'a' : 'd'}`,
                    number: entry.number,
                    question: question,
                    answer: entry.word,
                    direction: entry.direction,
                    row: entry.y,
                    col: entry.x,
                }
            });
            
            const newPuzzle: PuzzleData = {
                id: `custom-${Date.now()}`,
                title: data.title,
                clues,
                gridSize: { rows: puzzleLayout.height, cols: puzzleLayout.width },
                solutionGrid: puzzleLayout.grid,
                rewards: data.rewards,
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

            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-yellow-500" /> Từ khóa (Hàng dọc)</FormLabel>
                   <FormDescription>
                    Đây là từ chính người chơi cần đoán, sẽ được đặt dọc.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Ví dụ: SUTU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Các câu đố hàng ngang</h3>
                   <FormDescription>
                    Các đáp án sẽ được tự động sắp xếp để giao với từ khóa.
                  </FormDescription>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-background/50 space-y-4 relative">
                        <FormField
                            control={form.control}
                            name={`acrossClues.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Câu hỏi {index + 1}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Vua của muôn loài" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`acrossClues.${index}.answer`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Đáp án {index + 1}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: SUTU" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {fields.length > 1 && (
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
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ question: '', answer: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm câu đố hàng ngang
                </Button>
            </div>
            
            <div className="space-y-4">
                 <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Phần thưởng Vòng Quay May Mắn</h3>
                </div>
                 <FormField
                    control={form.control}
                    name="rewards"
                    render={() => (
                        <FormItem>
                             {form.formState.errors.rewards && <FormMessage>{form.formState.errors.rewards.message}</FormMessage>}
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {rewardFields.map((field, index) => (
                        <div key={field.id} className="relative">
                             <FormField
                                control={form.control}
                                name={`rewards.${index}.text`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder={`Phần thưởng ${index + 1}`} {...field} className="pr-8" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             {rewardFields.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-0 -translate-y-1/2 text-muted-foreground hover:text-destructive h-8 w-8"
                                    onClick={() => removeReward(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             )}
                        </div>
                    ))}
                </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => appendReward({ text: '' })}>
                    <Gift className="mr-2 h-4 w-4" />
                    Thêm Phần Thưởng
                </Button>
            </div>


            <div className="flex flex-wrap gap-4 items-center">
                <Button type="submit" disabled={isPending} size="lg">
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
                <CardHeader className="flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-center text-3xl font-bold text-primary tracking-wider font-headline">
                      {generatedPuzzle.title}
                      </CardTitle>
                    </div>
                    <Button variant="outline" onClick={() => { setGeneratedPuzzle(null); setShowForm(true); }}>
                        Chỉnh sửa
                    </Button>
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
