'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-provider';
import { BarChart, Gem, Gift, Hand, Hourglass, MapPin, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { countryCodeToData } from '@/lib/countries';

export default function ProfilePage() {
  const { 
    isConnected, 
    country, 
    totalClicks, 
    totalClaimed, 
    pendingClicks, 
    claimTokens 
  } = useUser();
  const router = useRouter();
  const [countryRank, setCountryRank] = useState(0);
  const [countryClicks, setCountryClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/game');
    }
  }, [isConnected, router]);

  useEffect(() => {
    async function fetchCountryRank() {
      if (country) {
        setLoading(true);
        const { data, error } = await supabase
          .from('country_clicks')
          .select('country_code, total_clicks')
          .order('total_clicks', { ascending: false });

        if (data) {
          const rank = data.findIndex(c => c.country_code === country) + 1;
          const clicks = data.find(c => c.country_code === country)?.total_clicks || 0;
          setCountryRank(rank);
          setCountryClicks(clicks);
        }
        setLoading(false);
      }
    }
    fetchCountryRank();
  }, [country]);
  
  if (!isConnected || loading) {
    return <div className="container py-10">Loading...</div>;
  }

  const countryData = countryCodeToData[country];
  const countryName = countryData ? countryData.name : country;
  const countryFlag = countryData ? countryData.flag : '';

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-8 w-8" />
          My Stats
        </h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={MapPin} title="Your Country" value={`${countryFlag} ${countryName}`} />
            <StatCard icon={Hand} title="Total Clicks" value={totalClicks.toLocaleString()} />
            <StatCard icon={Gem} title="FLOW Claimed" value={totalClaimed.toLocaleString()} />
            <StatCard icon={Hourglass} title="Pending Clicks" value={pendingClicks.toLocaleString()} />
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Claim Your Tokens</CardTitle>
            <CardDescription>
              You have {pendingClicks.toLocaleString()} clicks ready to be claimed as FLOW tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={claimTokens}
              disabled={pendingClicks <= 0}
            >
              <Gift className="mr-2 h-5 w-5" />
              CLAIM {pendingClicks.toLocaleString()} FLOW
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart/> Your Contribution</CardTitle>
            </CardHeader>
            <CardContent className='text-center'>
                <p className='text-4xl font-bold'>#{countryRank}</p>
                <p className='text-lg text-muted-foreground'>{countryName}: {countryClicks.toLocaleString()} clicks</p>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    );
  }