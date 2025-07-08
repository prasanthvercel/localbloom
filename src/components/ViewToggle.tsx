'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();

  const handleValueChange = (value: string) => {
    if (value !== pathname) {
      router.push(value);
    }
  };

  const currentValue = pathname === '/marketplace' ? '/marketplace' : '/';

  return (
    <div className="flex justify-center mb-8">
      <Tabs value={currentValue} onValueChange={handleValueChange} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="/">Search Products</TabsTrigger>
          <TabsTrigger value="/marketplace">Browse Vendors</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
