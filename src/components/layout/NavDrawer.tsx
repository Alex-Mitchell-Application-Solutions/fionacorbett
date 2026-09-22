'use client'

import { type ReactNode, useCallback, useId, useRef, useState } from 'react'

import { NavTrigger } from '@/components/layout/NavTrigger'

/**
 * The menu drawer's open state, and nothing else.
 *
 * The panel arrives as a prop, already rendered on the server, so the links in it
 * cost no client JavaScript. This file is a boolean and the calls that put the
 * dialog in the top layer.
 *
 * A modal <dialog>, opened with showModal(), because that gets the focus trap,
 * the inert page behind, Escape and the backdrop from the browser instead of
 * from code that has to be right. Ported from luxury-gardens.
 */
export function NavDrawer({ panel }: { panel: ReactNode }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => dialogRef.current?.close(), [])

  const openDrawer = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    setOpen(true)
  }, [])

  return (
    <>
      <NavTrigger
        action="open"
        expanded={open}
        controls={panelId}
        onClick={openDrawer}
        ref={triggerRef}
      />

      <dialog
        ref={dialogRef}
        id={panelId}
        aria-label="Menu"
        className="site-nav-drawer"
        // Fires for Escape and for close(), so state and element cannot disagree.
        onClose={() => {
          setOpen(false)
          triggerRef.current?.focus()
        }}
        onClick={(event) => {
          // A backdrop click targets the dialog itself: the backdrop is a
          // pseudo-element, so there is nothing else for it to hit.
          if (event.target === dialogRef.current) {
            close()
            return
          }
          // The panel is server-rendered and cannot carry its own onClick, so a
          // link click is caught here. Without it a client-side navigation
          // leaves the drawer open over the page just arrived at.
          if (event.target instanceof Element && event.target.closest('a[href]')) close()
        }}
      >
        <div className="site-nav-drawer-bar">
          <NavTrigger action="close" expanded controls={panelId} onClick={close} />
        </div>
        {panel}
      </dialog>
    </>
  )
}
