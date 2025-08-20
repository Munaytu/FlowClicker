'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-provider';
import { BarChart, Gem, Gift, Hand, Hourglass, MapPin, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mock data for country rank
const countryData = {
  country: 'Bolivia',
  clicks: 45678,
  rank: 23,
};

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

  useEffect(() => {
    if (!isConnected) {
      router.push('/game');
    }
  }, [isConnected, router]);
  
  if (!isConnected) {
    return null; // Or a loading/redirecting message
  }

  const countryFlag = country === 'BO' ? '🇧🇴' : ``; // Example for mock

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-8 w-8" />
          My Stats
        </h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={MapPin} title="Your Country" value={`${countryFlag} ${country}`} />
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
                <p className='text-4xl font-bold'>#{countryData.rank}</p>
                <p className='text-lg text-muted-foreground'>{countryData.country}: {countryData.clicks.toLocaleString()} clicks</p>
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
