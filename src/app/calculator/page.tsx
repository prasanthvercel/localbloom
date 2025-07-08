import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalculatorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center font-headline text-2xl">Expense Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            This feature is coming soon! Track your market spending here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
