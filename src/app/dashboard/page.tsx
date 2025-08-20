import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, Gem, Globe } from 'lucide-react';

const globalStats = {
  totalClicksToday: 2300000,
  totalFlowClaimed: 456000,
};

const topCountries = [
  { flag: '🇺🇸', name: 'USA', clicks: 234567 },
  { flag: '🇧🇷', name: 'Brasil', clicks: 187234 },
  { flag: '🇲🇽', name: 'Mexico', clicks: 145678 },
  { flag: '🇦🇷', name: 'Argentina', clicks: 123456 },
  { flag: '🇨🇴', name: 'Colombia', clicks: 98765 },
  { flag: '🇵🇪', name: 'Peru', clicks: 88123 },
  { flag: '🇪🇸', name: 'Spain', clicks: 76543 },
];

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
  return (
    <div className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Global Stats
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Clicks Today"
            value={globalStats.totalClicksToday.toLocaleString()}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
