import type { Metadata } from 'next';

import { LunarDashboard } from '@/components/lunar/LunarDashboard';
import { DEFAULT_FULL_MOON_WINDOW_DAYS, DEFAULT_LUNAR_USER } from '@/lib/lunar/config';
import { defaultDateRange } from '@/lib/lunar/date';

export const metadata: Metadata = {
  title: 'Lunar Velocity | Cockpit',
  description: 'Engineering output under the full moon.',
};

export default function LunarPage() {
  const range = defaultDateRange();

  return (
    <LunarDashboard
      initialUser={process.env.LUNAR_GITHUB_USER || DEFAULT_LUNAR_USER}
      initialStartDate={range.startDate}
      initialEndDate={range.endDate}
      initialWindowDays={DEFAULT_FULL_MOON_WINDOW_DAYS}
    />
  );
}
