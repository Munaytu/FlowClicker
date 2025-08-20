"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, Gem, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { countryCodeToData } from '@/lib/countries';



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

export default function DashboardPage() {
  const [globalStats, setGlobalStats] = useState({ totalClicksAllTime: 0, totalFlowClaimed: 0 });
  const [topCountries, setTopCountries] = useState<{ name: string; flag: string; clicks: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch global stats
      const { data: users, error: usersError } = await supabase.from('users').select('total_clicks, total_claimed');
      if (users) {
        const totalClicks = users.reduce((acc, user) => acc + user.total_clicks, 0);
        const totalClaimed = users.reduce((acc, user) => acc + user.total_claimed, 0);
        setGlobalStats({ totalClicksAllTime: totalClicks, totalFlowClaimed: totalClaimed });
      }

      // Fetch top countries
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

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Global Stats
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Clicks (All Time)"
            value={globalStats.totalClicksAllTime.toLocaleString()}
            icon={Flame}
          />
          <StatCard
            title="Total FLOW Claimed"
            value={globalStats.totalFlowClaimed.toLocaleString()}
            icon={Gem}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Countries by Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
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
  );
}