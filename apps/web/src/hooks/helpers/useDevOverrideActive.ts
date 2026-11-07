import { useDevHarness } from '~/hooks/helpers/useDevHarness';

function useDevOverrideActiveDev() {
  const { data } = useDevHarness();
  return !!data?.active;
}

const useDevOverrideActiveProd = () => false;

/**
  * Whether the dev harness episode override applies to this device.
  * NODE_ENV is inlined at build time, so prod gets a constant `false` and the harness is stripped.
  */
export const useDevOverrideActive = process.env.NODE_ENV === 'development'
  ? useDevOverrideActiveDev
  : useDevOverrideActiveProd;
