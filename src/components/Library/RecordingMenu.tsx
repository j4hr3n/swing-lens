import Sheet from '../shared/Sheet'
import type { Recording } from '../../types'

interface RecordingMenuProps {
  recording: Recording | undefined
  onClose: () => void
  onRename: () => void
  onDelete: () => void
}

export default function RecordingMenu({ recording, onClose, onRename, onDelete }: RecordingMenuProps) {
  return (
    <Sheet open={!!recording} onClose={onClose} title={recording?.name}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRename}
          className="flex w-full items-center gap-3 rounded-xl bg-[color:var(--color-bg-input)] p-3 text-left text-sm font-medium active:opacity-80"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-xl bg-[color:var(--color-bg-input)] p-3 text-left text-sm font-medium text-red-400 active:opacity-80"
        >
          Delete
        </button>
      </div>
    </Sheet>
  )
}
