import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dialog from './Dialog'
import Sheet from './Sheet'

afterEach(() => cleanup())

describe('Dialog', () => {
  it('closes on Escape and backdrop click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const { rerender } = render(
      <Dialog open title="Delete clip" onClose={onClose}>
        <button type="button">Cancel</button>
      </Dialog>,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <Dialog open title="Delete clip" onClose={onClose}>
        <button type="button">Cancel</button>
      </Dialog>,
    )
    await user.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when interacting inside the panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Dialog open title="Delete clip" onClose={onClose}>
        <button type="button">Cancel</button>
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Sheet', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Sheet open title="Add a swing" onClose={onClose}>
        <button type="button">Import</button>
      </Sheet>,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
