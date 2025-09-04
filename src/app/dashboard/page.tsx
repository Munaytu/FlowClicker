'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, Gem, Globe, HelpCircle, LinkIcon, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { countryCodeToData } from '@/lib/countries';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { contractAddress } from '@/lib/contract-config';
import AnimatedNumber from '@/components/ui/animated-number';

// Fetcher function for react-query
const fetchGlobalStats = async () => {
  const response = await fetch('/api/global-stats');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

function StatCard({ title, value, icon: Icon, tooltipText, isAnimated = false, localeOptions }: { title: string; value: string; icon: React.ElementType, tooltipText?: string, isAnimated?: boolean, localeOptions?: Intl.NumberFormatOptions }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
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
            <AnimatedNumber value={Number(value)} localeOptions={localeOptions} />
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: globalStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['globalStats'],
    queryFn: fetchGlobalStats,
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  const [topCountries, setTopCountries] = useState<{ name: string; flag: string; clicks: number }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  useEffect(() => {
    async function fetchCountries() {
      setIsLoadingCountries(true);
      const { data: countries, error: countriesError } = await supabase
        .from('country_clicks')
        .select('country_code, total_clicks')
        .order('total_clicks', { ascending: false })
        .limit(20);
      
      if (countries) {
        const formattedCountries = countries
          .map(country => {
            const countryData = countryCodeToData[country.country_code];
            return countryData ? { ...countryData, clicks: country.total_clicks } : null;
          })
          .filter(Boolean) as { name: string; flag: string; clicks: number }[];
        setTopCountries(formattedCountries);
      }
      setIsLoadingCountries(false);
    }

    fetchCountries();
  }, []);

  const loading = isLoadingStats || isLoadingCountries;

  if (loading && !globalStats) { // Show loading only on initial load
    return <div className="container py-10">Loading...</div>;
  }

  if (statsError) {
    return <div className="container py-10">Error loading stats. Please try again later.</div>;
  }

  const tokenomicsTooltip = `The total supply includes a 10% fee distribution: ${globalStats?.tokenomics.devFeeBps / 100}% for development, ${globalStats?.tokenomics.foundationFeeBps / 100}% for the foundation, and ${globalStats?.tokenomics.burnFeeBps / 100}% is burned.`;

  return (
    <div className="container py-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-6 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Global Stats
          </h1>
          <a href={`https://sonicscan.org/token/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            View Token on SonicScan <LinkIcon className="h-4 w-4" />
          </a>
        </div>

        <div className="md:col-span-2">
          <StatCard
            title="Total Clicks (All Time)"
            value={globalStats ? globalStats.totalClicksAllTime : '0'}
            icon={Flame}
            tooltipText="The total number of clicks made by all players since the beginning."
            isAnimated
          />
        </div>
        <div className="md:col-span-2">
          <StatCard
            title="Total Tokens Claimed"
            value={globalStats ? globalStats.totalClaimed : '0'}
            icon={Gem}
            tooltipText="The total amount of tokens claimed by all players. This represents the portion of the supply currently in circulation."
            isAnimated
            localeOptions={{ maximumFractionDigits: 2 }}
          />
        </div>
        <div className="md:col-span-2">
          <StatCard
            title="Total Token Supply"
            value={globalStats ? globalStats.totalSupply : '0'}
            icon={Package}
            tooltipText={tokenomicsTooltip}
            isAnimated
            localeOptions={{ maximumFractionDigits: 2 }}
          />
        </div>
        
        <div className="md:col-span-4">
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>🏆 Top Countries by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Rank</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCountries.map((country, index) => (
                      <TableRow key={country.name}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell className="flex items-center gap-3">
                          <span className="text-2xl">{country.flag}</span>
                          {country.name}
                        </TableCell>
                        <TableCell className="text-right font-mono">{country.clicks.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        
      </div>
    </div>
  );
}