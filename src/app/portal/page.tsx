
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Loader2, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Customer, PosMachine, SimCard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerPortalDisplay } from './components/portal-display';
import { useToast } from '@/hooks/use-toast';

type SearchType = 'customerId' | 'serialNumber' | 'posId';

export default function CustomerPortalPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchType, setSearchType] = useState<SearchType>('customerId');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue] = useDebounce(searchValue, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setSuggestionsVisible] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [machines, setMachines] = useState<PosMachine[]>([]);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestionsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const fetchSuggestions = useCallback(async () => {
    if (!firestore || debouncedSearchValue.length < 2) {
      setSuggestions([]);
      return;
    }

    let q;
    const fieldToSearch = searchType === 'customerId' ? 'bkcode' : searchType;
    const collectionName = searchType === 'customerId' ? 'customers' : 'posMachines';

    q = query(
        collection(firestore, collectionName),
        where(fieldToSearch, '>=', debouncedSearchValue),
        where(fieldToSearch, '<=', debouncedSearchValue + '\uf8ff'),
        limit(5)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const newSuggestions = querySnapshot.docs.map(doc => doc.data()[fieldToSearch]);
      setSuggestions(newSuggestions);
      if(newSuggestions.length > 0) {
        setSuggestionsVisible(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, [firestore, debouncedSearchValue, searchType]);

  useEffect(() => {
    fetchSuggestions();
  }, [debouncedSearchValue, fetchSuggestions]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSuggestionsVisible(false);
    if (!firestore || !searchValue) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال قيمة للبحث.',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setCustomer(null);
    setMachines([]);
    setSimCards([]);

    try {
      let customerData: Customer | null = null;

      if (searchType === 'customerId') {
        const q = query(
          collection(firestore, 'customers'),
          where('bkcode', '==', searchValue),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          customerData = { id: doc.id, ...doc.data() } as Customer;
        }
      } else if (searchType === 'serialNumber' || searchType === 'posId') {
        const machineQuery = query(
          collection(firestore, 'posMachines'),
          where(searchType, '==', searchValue),
          limit(1)
        );
        const machineSnapshot = await getDocs(machineQuery);
        if (!machineSnapshot.empty) {
          const machine = machineSnapshot.docs[0].data() as PosMachine;
          const customerQuery = query(
            collection(firestore, 'customers'),
            where('bkcode', '==', machine.customerId),
            limit(1)
          );
          const customerSnapshot = await getDocs(customerQuery);
          if (!customerSnapshot.empty) {
            const doc = customerSnapshot.docs[0];
            customerData = { id: doc.id, ...doc.data() } as Customer;
          }
        }
      }

      setCustomer(customerData);

      if (customerData) {
        // Fetch machines
        const machinesQuery = query(
          collection(firestore, 'posMachines'),
          where('customerId', '==', customerData.bkcode)
        );
        const machinesSnapshot = await getDocs(machinesQuery);
        const machinesData = machinesSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as PosMachine)
        );
        setMachines(machinesData);

        // Fetch SIM cards
        const simCardsQuery = query(
          collection(firestore, 'simCards'),
          where('customerId', '==', customerData.bkcode)
        );
        const simCardsSnapshot = await getDocs(simCardsQuery);
        const simCardsData = simCardsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SimCard)
        );
        setSimCards(simCardsData);
      } else {
        toast({
            variant: "destructive",
            title: "لم يتم العثور على نتائج",
            description: "لم يتم العثور على عميل يطابق معايير البحث.",
          });
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description:
          'حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    setSuggestionsVisible(false);
  }

  return (
    <div className="flex-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بوابة العميل</CardTitle>
          <CardDescription>
            ابحث عن عميل لعرض جميع بياناته وأجهزته والشرائح المرتبطة به.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex items-end gap-2">
            <div className="flex-grow relative" ref={searchContainerRef}>
              <label htmlFor="search-value" className="text-sm font-medium">قيمة البحث</label>
              <Input
                id="search-value"
                placeholder="أدخل القيمة هنا..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSuggestionsVisible(true)}
                disabled={!user || isLoading}
                autoComplete="off"
              />
              {isSuggestionsVisible && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full rounded-md border bg-background shadow-lg z-10">
                    {suggestions.map((s, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleSuggestionClick(s)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        >
                            {s}
                        </div>
                    ))}
                </div>
              )}
            </div>
            <div>
                <label htmlFor="search-type" className="text-sm font-medium">نوع البحث</label>
                <Select
                    value={searchType}
                    onValueChange={(v) => {
                        setSearchType(v as SearchType);
                        setSearchValue('');
                        setSuggestions([]);
                    }}
                    disabled={!user || isLoading}
                    dir="rtl"
                >
                    <SelectTrigger id="search-type" className="w-[180px]">
                    <SelectValue placeholder="اختر نوع البحث" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="customerId">رقم العميل</SelectItem>
                    <SelectItem value="serialNumber">الرقم التسلسلي</SelectItem>
                    <SelectItem value="posId">معرف النظام (POS ID)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={!user || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              بحث
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mr-4 text-muted-foreground">...جاري البحث</p>
        </div>
      ) : hasSearched ? (
        customer ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                  <CardTitle>بيانات العميل: {customer.client_name}</CardTitle>
                  <CardDescription>عرض تفصيلي للأجهزة والبيانات المرتبطة بالعميل صاحب رقم: {customer.bkcode}</CardDescription>
              </CardHeader>
            </Card>
            <CustomerPortalDisplay
              customer={customer}
              machines={machines}
              simCards={simCards}
            />
          </div>
        ) : (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">لم يتم العثور على عميل. الرجاء التأكد من قيمة البحث والمحاولة مرة أخرى.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="text-center py-10">
          <CardContent>
            <p className="text-muted-foreground">أدخل معايير البحث أعلاه للبدء.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
