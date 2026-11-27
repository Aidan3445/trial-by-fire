'use client';

import { useState } from 'react';
import { Button } from '~/components/common/button';
import { Input } from '~/components/common/input';
import { Label } from '~/components/common/label';
import { Switch } from '~/components/common/switch';
import { Textarea } from '~/components/common/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/common/select';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { cn } from '~/lib/utils';
import { LeagueMemberRoles } from '~/lib/leagues';
import {
  DEFAULT_MANUAL_PUSH_FILTERS, MANUAL_PUSH_BODY_MAX_LENGTH, MANUAL_PUSH_TITLE_MAX_LENGTH,
  ManualPushMembershipLabels, ManualPushMemberships, ManualPushRoleMemberships, ManualPushSeasonMemberships,
  PushPlatforms, PushPreferenceKeys, PushPreferenceLabels,
  type ManualPushFilters, type ManualPushMembership, type ManualPushResult, type PushPreferenceKey,
} from '~/types/manualPush';

const CURRENT_SEASON = 'current';
const ANY_SETTING = 'any';

async function postPush(filters: ManualPushFilters, title: string, body: string, dryRun: boolean) {
  const res = await fetch('/api/sys/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, title, body, dryRun }),
  });
  const data = await res.json() as ManualPushResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Failed to send the push');
  return data;
}

/** Toggle buttons for picking any number of options; none picked means all */
function Toggles<T extends string>({ options, value, onChange, label }: {
  options: readonly T[];
  value: T[];
  onChange: (_value: T[]) => void;
  label: (_option: T) => string;
}) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type='button'
            onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
            className={cn(
              'cursor-pointer rounded-md border-2 px-2.5 py-1 text-xs font-bold transition-colors',
              on ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent border-primary/20 hover:border-primary/50')}>
            {label(option)}
          </button>
        );
      })}
    </div>
  );
}

/**
  * Write a push notification and send it to everyone, or an audience narrowed by filters
  */
export default function ManualPush() {
  const { data: seasons } = useSeasons(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [filters, setFilters] = useState<ManualPushFilters>(DEFAULT_MANUAL_PUSH_FILTERS);
  const [count, setCount] = useState<ManualPushResult | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (changes: Partial<ManualPushFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setCount(null);
  };

  const preview = async () => {
    setBusy(true);
    try {
      setCount(await postPush(filters, title, body, true));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to count recipients');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setBusy(true);
    try {
      // Count right before sending so the confirmation is accurate
      const recipients = await postPush(filters, title, body, true);
      setCount(recipients);
      if (recipients.devices === 0) {
        alert('Nobody matches these filters.');
        return;
      }
      if (!confirm(`Send "${title}" to ${recipients.users} users on ${recipients.devices} devices?`)) return;
      const result = await postPush(filters, title, body, false);
      alert(`Sent to ${result.users} users on ${result.devices} devices.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send the push');
    } finally {
      setBusy(false);
    }
  };

  const usesSeason = ManualPushSeasonMemberships.includes(filters.membership);
  const usesRoles = ManualPushRoleMemberships.includes(filters.membership);
  const canSend = title.trim() !== '' && body.trim() !== '' && !busy;

  return (
    <section className='bg-card rounded-lg p-4 space-y-4 border-2 border-primary/20'>
      <h2 className='text-xl font-black uppercase tracking-tight'>Manual Push</h2>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label htmlFor='push-title'>Title</Label>
            <Input
              id='push-title'
              maxLength={MANUAL_PUSH_TITLE_MAX_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='push-body'>Message</Label>
            <Textarea
              id='push-body'
              rows={4}
              maxLength={MANUAL_PUSH_BODY_MAX_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>

        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>League membership</Label>
            <Select
              value={filters.membership}
              onValueChange={(membership) => update({ membership: membership as ManualPushMembership })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ManualPushMemberships.map((membership) => (
                  <SelectItem key={membership} value={membership}>{ManualPushMembershipLabels[membership]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {usesSeason && (
            <div className='space-y-1'>
              <Label>Season</Label>
              <Select
                value={filters.seasonId === null ? CURRENT_SEASON : String(filters.seasonId)}
                onValueChange={(value) => update({ seasonId: value === CURRENT_SEASON ? null : Number(value) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CURRENT_SEASON}>Current season</SelectItem>
                  {seasons?.map((season) => (
                    <SelectItem key={season.seasonId} value={String(season.seasonId)}>{season.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {usesRoles && (
            <div className='space-y-1'>
              <Label>Roles (none picked means any)</Label>
              <Toggles
                options={LeagueMemberRoles}
                value={filters.roles}
                onChange={(roles) => update({ roles })}
                label={(role) => role} />
            </div>
          )}

          <div className='space-y-1'>
            <Label>Platforms (none picked means both)</Label>
            <Toggles
              options={PushPlatforms}
              value={filters.platforms}
              onChange={(platforms) => update({ platforms })}
              label={(platform) => platform === 'ios' ? 'iOS' : 'Android'} />
          </div>

          <div className='space-y-1'>
            <Label>Only if this notification setting is on</Label>
            <Select
              value={filters.preference ?? ANY_SETTING}
              onValueChange={(value) => update({ preference: value === ANY_SETTING ? null : value as PushPreferenceKey })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_SETTING}>Ignore settings</SelectItem>
                {PushPreferenceKeys.map((key) => (
                  <SelectItem key={key} value={key}>{PushPreferenceLabels[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2'>
            <Switch
              id='push-live'
              checked={filters.liveOptIn}
              onCheckedChange={(liveOptIn) => update({ liveOptIn })} />
            <Label htmlFor='push-live'>Opted into live scoring for the episode airing now</Label>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <Button variant='outline' disabled={busy} onClick={() => void preview()}>Count recipients</Button>
        <Button disabled={!canSend} onClick={() => void send()}>{busy ? 'Working...' : 'Send'}</Button>
        {count && (
          <span className='text-sm text-muted-foreground'>
            {count.users} users on {count.devices} devices
          </span>
        )}
      </div>
    </section>
  );
}
