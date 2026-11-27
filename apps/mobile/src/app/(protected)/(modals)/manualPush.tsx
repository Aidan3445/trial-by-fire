import { useState, type ReactNode } from 'react';
import { Alert, Platform, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Button from '~/components/common/button';
import SearchableSelect from '~/components/common/searchableSelect';
import ManagerHeader from '~/components/sys/managerHeader';
import { useFetch } from '~/hooks/helpers/useFetch';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { LeagueMemberRoles } from '~/lib/leagues';
import {
  DEFAULT_MANUAL_PUSH_FILTERS, MANUAL_PUSH_BODY_MAX_LENGTH, MANUAL_PUSH_TITLE_MAX_LENGTH,
  ManualPushMembershipLabels, ManualPushMemberships, ManualPushRoleMemberships, ManualPushSeasonMemberships,
  PushPlatforms, PushPreferenceKeys, PushPreferenceLabels,
  type ManualPushFilters, type ManualPushResult,
} from '~/types/manualPush';

const CURRENT_SEASON = 'current';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className='gap-1.5'>
      <Text className='text-sm font-bold uppercase text-muted-foreground'>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      className={cn(
        'rounded-md border-2 px-3 py-1.5',
        selected ? 'border-primary bg-primary' : 'border-primary/20 bg-primary/5'
      )}>
      <Text className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-foreground')}>{label}</Text>
    </Button>
  );
}

/** Pick any number of options; none picked means all */
function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export default function ManualPushScreen() {
  const { data: userId, isLoading, isError } = useSysAdmin();
  const router = useRouter();
  const headerHeight = useHeaderHeight(Platform.OS === 'ios' ? 0 : undefined);
  const postPush = useFetch('POST');
  const { data: seasons } = useSeasons(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [filters, setFilters] = useState<ManualPushFilters>(DEFAULT_MANUAL_PUSH_FILTERS);
  const [count, setCount] = useState<ManualPushResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <View className='flex-1 bg-background justify-center items-center'>
        <ManagerHeader title='Manual Push' />
        <Text className='text-lg text-center'>Checking Sys Admin Status...</Text>
      </View>
    );
  }
  if (isError || !userId) {
    router.dismiss();
    return null;
  }

  const update = (changes: Partial<ManualPushFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setCount(null);
  };

  const request = async (dryRun: boolean) => {
    const res = await postPush('/api/sys/push', { body: { filters, title, body, dryRun } });
    const data = (await res.json()) as ManualPushResult & { error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Failed to send the push');
    return data;
  };

  const preview = async () => {
    setBusy(true);
    try {
      setCount(await request(true));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to count recipients');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setBusy(true);
    try {
      // Count right before sending so the confirmation is accurate
      const recipients = await request(true);
      setCount(recipients);
      if (recipients.devices === 0) {
        Alert.alert('Nobody to send to', 'Nobody matches these filters.');
        setBusy(false);
        return;
      }
      Alert.alert(
        'Send push?',
        `Send "${title.trim()}" to ${recipients.users} users on ${recipients.devices} devices?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setBusy(false) },
          {
            text: 'Send',
            style: 'destructive',
            onPress: () => void (async () => {
              try {
                const result = await request(false);
                Alert.alert('Sent', `Sent to ${result.users} users on ${result.devices} devices.`);
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send the push');
              } finally {
                setBusy(false);
              }
            })(),
          },
        ],
        { cancelable: true, onDismiss: () => setBusy(false) }
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to count recipients');
      setBusy(false);
    }
  };

  const usesSeason = ManualPushSeasonMemberships.includes(filters.membership);
  const usesRoles = ManualPushRoleMemberships.includes(filters.membership);
  const canSend = title.trim() !== '' && body.trim() !== '' && !busy;
  const inputClass = 'rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 text-base text-foreground';
  const seasonOptions = [
    { label: 'Current season', value: CURRENT_SEASON },
    ...(seasons ?? []).map((season) => ({ label: season.name, value: String(season.seasonId) })),
  ];

  return (
    <View className='flex-1 bg-background'>
      <ManagerHeader title='Manual Push' />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 48, paddingHorizontal: 12, gap: 16 }}
        keyboardShouldPersistTaps='handled'>
        <Field label='Title'>
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={setTitle}
            maxLength={MANUAL_PUSH_TITLE_MAX_LENGTH}
            placeholderTextColor={colors.mutedForeground}
            placeholder='Notification title' />
        </Field>
        <Field label='Message'>
          <TextInput
            className={cn(inputClass, 'min-h-24')}
            value={body}
            onChangeText={setBody}
            maxLength={MANUAL_PUSH_BODY_MAX_LENGTH}
            multiline
            textAlignVertical='top'
            placeholderTextColor={colors.mutedForeground}
            placeholder='What to tell them' />
        </Field>

        <Field label='League membership'>
          <View className='flex-row flex-wrap gap-1.5'>
            {ManualPushMemberships.map((membership) => (
              <Chip
                key={membership}
                label={ManualPushMembershipLabels[membership]}
                selected={filters.membership === membership}
                onPress={() => update({ membership })} />
            ))}
          </View>
        </Field>

        {usesSeason && (
          <Field label='Season'>
            <SearchableSelect
              options={seasonOptions}
              selectedValue={filters.seasonId === null ? CURRENT_SEASON : String(filters.seasonId)}
              onSelect={(value) => update({ seasonId: value === CURRENT_SEASON ? null : Number(value) })}
              placeholder='Search seasons...' />
          </Field>
        )}

        {usesRoles && (
          <Field label='Roles (none picked means any)'>
            <View className='flex-row flex-wrap gap-1.5'>
              {LeagueMemberRoles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  selected={filters.roles.includes(role)}
                  onPress={() => update({ roles: toggle(filters.roles, role) })} />
              ))}
            </View>
          </Field>
        )}

        <Field label='Platforms (none picked means both)'>
          <View className='flex-row flex-wrap gap-1.5'>
            {PushPlatforms.map((platform) => (
              <Chip
                key={platform}
                label={platform === 'ios' ? 'iOS' : 'Android'}
                selected={filters.platforms.includes(platform)}
                onPress={() => update({ platforms: toggle(filters.platforms, platform) })} />
            ))}
          </View>
        </Field>

        <Field label='Only if this notification setting is on'>
          <View className='flex-row flex-wrap gap-1.5'>
            <Chip label='Ignore settings' selected={filters.preference === null} onPress={() => update({ preference: null })} />
            {PushPreferenceKeys.map((key) => (
              <Chip
                key={key}
                label={PushPreferenceLabels[key]}
                selected={filters.preference === key}
                onPress={() => update({ preference: key })} />
            ))}
          </View>
        </Field>

        <View className='flex-row items-center gap-2'>
          <Switch
            value={filters.liveOptIn}
            onValueChange={(liveOptIn) => update({ liveOptIn })}
            trackColor={{ false: colors.accent, true: colors.primary }}
            thumbColor='white' />
          <Text className='flex-1 text-base text-foreground'>Opted into live scoring for the episode airing now</Text>
        </View>

        {count && (
          <Text className='text-center text-base text-muted-foreground'>
            {count.users} users on {count.devices} devices
          </Text>
        )}
        <View className='flex-row gap-2'>
          <Button
            className={cn('flex-1 items-center rounded-lg border-2 border-primary p-3', busy && 'opacity-50')}
            disabled={busy}
            onPress={() => void preview()}>
            <Text className='font-semibold text-primary'>Count recipients</Text>
          </Button>
          <Button
            className={cn('flex-1 items-center rounded-lg bg-primary p-3', !canSend && 'opacity-50')}
            disabled={!canSend}
            onPress={() => void send()}>
            <Text className='font-semibold text-white'>{busy ? 'Working...' : 'Send'}</Text>
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
