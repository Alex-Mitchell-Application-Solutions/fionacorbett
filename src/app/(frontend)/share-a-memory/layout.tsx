import type { ReactNode } from 'react'

import { StandaloneFrame } from '@/components/layout/StandaloneFrame'

/**
 * Deliberately outside the `(site)` group, so this route inherits none of the
 * site's navigation.
 *
 * This URL is shared on its own while the rest of the site is still being built.
 * Everything a recipient can click here stays on this page.
 */
export default function ShareLayout({ children }: { children: ReactNode }) {
  return <StandaloneFrame>{children}</StandaloneFrame>
}
