'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-provider';
import { BarChart, Gem, Gift, Hand, Hourglass, MapPin, User as UserIcon, Wallet, HelpCircle, TrendingDown, LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { countryCodeToData } from '@/lib/countries';
import { useBalance } from 'wagmi';
import { contractAddress } from '@/lib/contract-config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import AnimatedNumber from '@/components/ui/animated-number';

export default function ProfilePage() {
  const {
    isConnected,
    country,
    totalClicks,
    totalClaimed,
    pendingClicks,
    claimedClicks,
    claimTokens,
    walletAddress,
    claimableTokens,
    decayInfo,
    isClaiming,
    currentRewardPerClick,
    tokenPriceUSD
  } = useUser();
  const router = useRouter();
  const [countryRank, setCountryRank] = useState(0);
  const [countryClicks, setCountryClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  const { data: balance } = useBalance({
    address: walletAddress!,
    token: contractAddress,
    chainId: 146, // Always query the Sonic chain
  });

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

  const pendingClicksTooltip = `You have ${pendingClicks ? pendingClicks.toLocaleString() : '0'} un-claimed clicks. The claimable token amount changes in real-time based on a decay mechanism.`;

  const balanceAmount = Number(balance?.formatted ?? 0);
  const usdValue = tokenPriceUSD ? balanceAmount * tokenPriceUSD : 0;

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-8 w-8" />
          My Stats
        </h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            icon={Wallet} 
            title="My Wallet Balance" 
            value={`${balanceAmount ? balanceAmount.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'} ${balance?.symbol}`}
            tooltipText="Your current token balance in your connected wallet. Click to view on SonicScan."
            link={`https://sonicscan.org/address/${walletAddress}`}
            isAnimated
            localeOptions={{ maximumFractionDigits: 4 }}
          />
          <StatCard 
            icon={Gem} 
            title="Tokens Claimed" 
            value={totalClaimed ? totalClaimed.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} 
            subValue={`${claimedClicks ? claimedClicks.toLocaleString() : '0'} clicks converted`}
            tooltipText="The total amount of tokens you have successfully claimed from your clicks." 
            isAnimated
            localeOptions={{ maximumFractionDigits: 2 }}
          />
          <StatCard 
            icon={Hand} 
            title="My Total Clicks" 
            value={totalClicks ? totalClicks.toLocaleString() : '0'} 
            tooltipText="Your lifetime click count. Keep clicking!" 
            isAnimated
            localeOptions={{ maximumFractionDigits: 0 }}
          />
          <StatCard 
            icon={Hourglass} 
            title="Pending Clicks" 
            value={pendingClicks ? pendingClicks.toLocaleString() : '0'} 
            tooltipText={pendingClicksTooltip} 
            isAnimated
            localeOptions={{ maximumFractionDigits: 0 }}
          />
          <StatCard 
            icon={Gift} 
            title="Ready to Claim" 
            value={`${claimableTokens ? parseFloat(claimableTokens).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'} ${balance?.symbol}`}
            tooltipText="The real-time amount of tokens you will receive for your pending clicks right now." 
            isAnimated
            localeOptions={{ maximumFractionDigits: 4 }}
          />
          <StatCard icon={MapPin} title="Your Country" value={`${countryFlag} ${countryName}`} />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Claim Your Tokens</CardTitle>
              <CardDescription>
                You have {pendingClicks ? pendingClicks.toLocaleString() : '0'} clicks ready to be claimed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold">
                <AnimatedNumber value={Number(claimableTokens)} localeOptions={{ maximumFractionDigits: 4 }} />
              </p>
              <p className="text-sm text-muted-foreground">${balance?.symbol} Tokens</p>
              <Button
                size="lg"
                className="w-full text-lg font-bold mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={claimTokens}
                disabled={pendingClicks <= 0 || isClaiming}
              >
                {isClaiming ? 'Claiming...' : `Claim Now`}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown /> Reward Decay Explained</CardTitle>
              <CardDescription>The number of tokens you receive per click decreases over time.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {decayInfo ? (
                <div className='text-sm'>
                  <div className="mb-4 p-3 rounded-lg border bg-muted text-center">
                    <p className="font-bold text-lg text-primary">
                      <AnimatedNumber value={Number(currentRewardPerClick)} localeOptions={{ maximumFractionDigits: 6 }} />
                    </p>
                    <p className="text-xs text-muted-foreground">Current Tokens / Click</p>
                  </div>
                  <p>The reward for each click started at <strong>{decayInfo.initialReward}</strong> tokens and will decrease to <strong>{decayInfo.finalReward}</strong> tokens over approximately <strong>{decayInfo.decayDurationInDays} days</strong>.</p>
                  <p className="mt-2">This decay period started <strong>{formatDistanceToNow(new Date(decayInfo.launchTimestamp * 1000), { addSuffix: true })}</strong>.</p>
                  <p className="mt-2 text-muted-foreground">This mechanism is designed to reward early participants more while ensuring the long-term sustainability of the token.</p>
                  <a href={`https://sonicscan.org/token/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-3">
                    View Token Contract <LinkIcon className="h-4 w-4" />
                  </a>
                </div>
              ) : <p>Loading decay information...</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart /> Your Contribution</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-4xl font-bold'>#{countryRank > 0 ? countryRank : 'N/A'}</p>
            <p className='text-lg text-muted-foreground'>{countryName}: <AnimatedNumber value={countryClicks} localeOptions={{ maximumFractionDigits: 0 }} /> clicks</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, tooltipText, link, isAnimated = false, localeOptions }: { title: string; value: string; subValue?: string; icon: React.ElementType, tooltipText?: string, link?: string, isAnimated?: boolean, localeOptions?: Intl.NumberFormatOptions }) {
  const cardContent = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          {title}
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isAnimated ? (
            <AnimatedNumber value={Number(value.split(' ')[0].replace(/,/g, ''))} localeOptions={localeOptions} />
          ) : (
            value
          )}
           {value.split(' ').length > 1 && ` ${value.split(' ')[1]}`}
        </div>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}