import { View, Text } from 'react-native';
import { Controller } from 'react-hook-form';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';
import ShotInTheDark from '~/components/leagues/hub/picks/shotInTheDark';
import { useChangeCastaway } from '~/hooks/leagues/mutation/useChangeCastaway';
import Modal from '~/components/common/modal';
import { getContrastingColor } from '@uiw/color-convert';
import Button from '~/components/common/button';

export default function ChangeCastaway() {
  const {
    keyEpisodes,
    secondaryPickSettings,
    availableCastaways,
    pickPriority,
    secondaryCastawayOptions,
    form,
    selected,
    secondarySelected,
    handleSelectionChange,
    handleSubmit,
    handleSecondarySubmit,
    isSubmitting,
    isSubmittingSecondary,
    canSubmitMain,
    canSubmitSecondary,
    isEpisodeAiring,
    dialogOpen,
    closedDialog,
    markDialogClosed,
    uiState,
    hoursRemainingForPriority,
  } = useChangeCastaway();

  if (uiState === 'inactive') return null;

  const isActiveAfterRedemption = (castaway: typeof availableCastaways[number]) =>
    castaway.redemption?.some((r) => r.secondEliminationEpisode === null) ?? false;

  const mainPickOptions = availableCastaways.map((castaway) => {
    const isFinallyEliminated = !!(castaway.eliminatedEpisode && !isActiveAfterRedemption(castaway));
    const isDisabled = castaway.castawayId !== +selected && !!(castaway.pickedBy || isFinallyEliminated);
    return {
      value: castaway.castawayId,
      label: castaway.fullName,
      disabled: isDisabled,
      renderLabel: () => (
        <View
          className='flex-1 flex-row items-center gap-2 rounded-md p-1'
          style={isDisabled ? { backgroundColor: castaway.pickedBy?.color ?? colors.neutral } : undefined}>
          {castaway.tribe && (
            <ColorRow className='w-min' color={castaway.tribe.color}>
              <Text
                className='text-base font-medium'
                style={isDisabled ? { color: getContrastingColor(castaway.pickedBy?.color ?? colors.neutral!) } : undefined}>
                {castaway.tribe.name}
              </Text>
            </ColorRow>
          )}
          <Text
            className='text-base'
            style={isDisabled ? { color: getContrastingColor(castaway.pickedBy?.color ?? colors.neutral!) } : undefined}>
            {castaway.fullName}
            {isDisabled && castaway.pickedBy && ` (${castaway.pickedBy.displayName})`}
          </Text>
        </View>
      ),
    };
  });

  const onSubmitMain = () => void handleSubmit();
  const onSubmitSecondary = () => void handleSecondarySubmit();

  return (
    <>
      <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-4'>

        {/* Primary pick section */}
        {uiState === 'no-castaways' ? (
          <View className='items-center gap-2 p-2'>
            <Text className='text-xl font-bold uppercase tracking-wider text-muted-foreground'>
              No Castaways Available
            </Text>
            <Text className='text-base text-muted-foreground text-center'>
              All castaways are either selected or eliminated.
            </Text>
          </View>
        ) : uiState === 'wait-for-priority' ? (
          <View className='gap-2'>
            <View className='flex-row items-center gap-2 px-1'>
              <View className='h-6 w-1 rounded-full bg-primary' />
              <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                Wait to Swap
              </Text>
            </View>
            <Text className='text-base text-muted-foreground px-1'>
              Recently eliminated members have{' '}
              {hoursRemainingForPriority > 1
                ? `${hoursRemainingForPriority} hours`
                : 'less than 1 hour'}{' '}
              left to pick first:
            </Text>
            <View className='gap-1 px-1'>
              {pickPriority.map((member) => (
                <ColorRow key={member.memberId} color={member.color}>
                  <Text className='text-base text-foreground'>{member.displayName}</Text>
                </ColorRow>
              ))}
            </View>
          </View>
        ) : (
          <View className='gap-2'>
            <View className='flex-row items-center gap-2 px-1'>
              <View className='h-12 w-1 rounded-full bg-primary' />
              <View>
                <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                  Swap Survivor
                </Text>
                <Text className='text-sm font-semibold text-muted-foreground'>
                  (Your main castaway)
                </Text>
              </View>
            </View>
            <View className='gap-2'>
              <Controller
                control={form.control}
                name='castawayId'
                render={() => (
                  <SearchableSelect
                    options={mainPickOptions}
                    selectedValue={selected ? parseInt(selected) : undefined}
                    onSelect={(value) => handleSelectionChange('survivor', String(value))}
                    placeholder='Select new survivor' />
                )} />
              <Button
                onPress={onSubmitMain}
                disabled={!canSubmitMain}
                className={cn(
                  'rounded-lg bg-primary p-3 active:opacity-80',
                  !canSubmitMain && 'opacity-50'
                )}>
                <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
                  {isEpisodeAiring ? 'Episode Airing' : isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </Button>
            </View>
          </View>
        )}

        {/* Secondary Pick Section */}
        {secondaryPickSettings?.enabled && keyEpisodes?.nextEpisode && (
          <View className='gap-2'>
            <View className='flex-row items-center gap-2 px-1'>
              <View className='h-12 w-1 rounded-full bg-primary' />
              <View>
                <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                  Secondary Pick
                </Text>
                <Text className='text-sm font-semibold text-muted-foreground'>
                  (Choose weekly for extra points)
                </Text>
              </View>
            </View>
            <View className='gap-2'>
              <SearchableSelect
                options={secondaryCastawayOptions}
                selectedValue={secondarySelected ? parseInt(secondarySelected) : undefined}
                onSelect={(value) => handleSelectionChange('secondary', String(value))}
                placeholder='Select secondary pick' />
              <Button
                onPress={onSubmitSecondary}
                disabled={!canSubmitSecondary}
                className={cn(
                  'rounded-lg bg-primary p-3 active:opacity-80',
                  !canSubmitSecondary && 'opacity-50'
                )}>
                <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
                  {isEpisodeAiring ? 'Episode Airing' : isSubmittingSecondary ? 'Submitting...' : 'Submit'}
                </Text>
              </Button>
            </View>
          </View>
        )}

        <ShotInTheDark />
      </View>

      <Modal visible={dialogOpen && !closedDialog} onClose={markDialogClosed}>
        <View className='gap-4'>
          <Text className='text-xl font-black uppercase tracking-tight text-foreground text-center'>
            Oh no!
          </Text>
          <Text className='text-base text-muted-foreground'>
            Your survivor was eliminated, but you get another chance.
            {'\n\n'}
            Choose from the remaining castaways to continue earning points.
            {'\n\n'}
            You're still in it, good luck!
          </Text>
          <Button
            onPress={markDialogClosed}
            className='rounded-lg bg-primary p-3 active:opacity-80'>
            <Text className='text-center text-base font-bold uppercase tracking-wider text-primary-foreground'>
              Got it!
            </Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}
