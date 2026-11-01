'use client';
import '~/styles/globals.css';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { SidebarMenuButton, SidebarMenu } from '~/components/common/sidebar';
import { Crown, HelpCircle, LoaderCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import { type MouseEvent, useRef, useState, useEffect } from 'react';
import TutorialModal from '~/components/shared/tutorial/modal';
import { BUY_ME_A_COFFEE_LINK, markDonationPending } from '~/components/sys/donation/startDonation';
import SupporterPage from '~/components/sys/donation/supporterPage';
import { useDonationStatus, useFunding } from '~/hooks/user/useFunding';

const APP_STORE_URL = 'https://apps.apple.com/app/id6759011635';
const BUY_ME_A_COFFEE_URL =
  'https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=aidanweinberg&button_colour=40DCA5&font_colour=684528&font_family=Lato&outline_colour=684528&coffee_colour=FFDD00';

export default function SideNavFooter() {
  const userButtonRef = useRef<HTMLDivElement>(null);
  const logInButtonRef = useRef<HTMLDivElement>(null);
  const [cacheBuster, setCacheBuster] = useState('');
  const { data: funding } = useFunding();
  const { data: donationStatus } = useDonationStatus();
  const isDonor = !!donationStatus && (donationStatus.donatedBefore || donationStatus.donatedThisSeason);
  const fundedPercent = funding && funding.total.goal > 0
    ? Math.min(100, (funding.total.coverage / funding.total.goal) * 100)
    : null;

  const handleMenuButtonClick = (ref: React.RefObject<HTMLDivElement | null>) => (e: MouseEvent) => {
    // Clicks in Clerk's modal (like the Supporter page) bubble here through the React portal
    if (!e.currentTarget.contains(e.target as Node)) return;
    e.preventDefault();
    const userButtonTrigger = ref.current?.querySelector('button');
    if (userButtonTrigger && !userButtonTrigger.contains(e.target as Node)) {
      userButtonTrigger.click();
    }
  };

  useEffect(() => {
    // Set a cache buster to force reload the image and bypass any caching
    setCacheBuster(`&t=${new Date().getTime()}`);
  }, []);

  return (
    <SidebarMenu className='mt-2'>
      <TutorialModal>
        <SidebarMenuButton size='lg' className='h-10!'>
          <div className='w-full flex gap-2 items-center cursor-pointer'>
            <HelpCircle size={36} strokeWidth={1.5} className='stroke-primary' />
            <p className='text-primary'>How to Play</p>
          </div>
        </SidebarMenuButton>
      </TutorialModal>
      <SidebarMenuButton
        className='hover:bg-transparent! active:bg-transparent!'
        asChild
        size='lg'>
        <Link href={BUY_ME_A_COFFEE_LINK} target='_blank' rel='noreferrer' onClick={markDonationPending}>
          {/* Scales as one so the progress bar stays on the button's bottom border */}
          <span className='relative block w-fit hover:scale-105 active:scale-[1.075] transition-all'>
            <img
              src={`${BUY_ME_A_COFFEE_URL}${cacheBuster}`}
              alt='Buy me a coffee'
              width={200}
              height={50} />
            {fundedPercent !== null && fundedPercent !== 100 && (
              <span
                className='absolute inset-x-1 bottom-px h-0.75 overflow-hidden rounded-full bg-b1/25'
                role='progressbar'
                aria-label='Funding raised'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fundedPercent)}
                title={`$${funding!.total.coverage} of $${funding!.total.goal} raised`}>
                <span className='block h-full rounded-full bg-b1' style={{ width: `${fundedPercent}%` }} />
              </span>
            )}
          </span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton
        className='hover:bg-transparent! active:bg-transparent!'
        asChild
        size='lg'>
        <Link
          className='hover:scale-105 active:scale-[1.075] transition-all'
          href={APP_STORE_URL}
          target='_blank'
          rel='noreferrer'>
          <div className='w-full bg-black rounded-[10px]'>
            <div className='relative h-10 w-fit'>
              <img
                className='h-full'
                src='https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg'
                alt='Download on the App Store' />
              <div className='absolute inset-px rounded-[5.75px] ring ring-black pointer-events-none' />
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
      <SignedIn>
        <SidebarMenuButton className='h-10!' size='lg' onClick={handleMenuButtonClick(userButtonRef)}>
          <div className='pointer-events-none flex' ref={userButtonRef}>
            <UserButton showName fallback={
              <div>
                <LoaderCircle className='animate-spin stroke-primary' size={24} />
              </div>
            }>
              {isDonor && (
                <UserButton.UserProfilePage label='Supporter' url='supporter' labelIcon={<Crown size={16} fill='currentColor' />}>
                  <SupporterPage />
                </UserButton.UserProfilePage>
              )}
            </UserButton>
          </div>
        </SidebarMenuButton>
      </SignedIn>
      <SignedOut>
        <SidebarMenuButton className='h-10!' size='lg' onClick={handleMenuButtonClick(logInButtonRef)}>
          <div className='flex w-full' ref={logInButtonRef}>
            <SignInButton mode='modal'>
              <div className='w-full flex gap-2 items-center cursor-pointer'>
                <LogIn size={36} strokeWidth={1.5} className='stroke-primary' />
                <p className='text-primary'>Sign In</p>
              </div>
            </SignInButton>
          </div>
        </SidebarMenuButton>
      </SignedOut>
    </SidebarMenu>
  );
}
