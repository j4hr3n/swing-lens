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
    <Sheet open={!!recording} onClose={onClose} kicker="Clip" title={recording?.name}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRename}
          className="w-full border border-[color:var(--color-border)] px-4 py-3 text-left text-[14px] font-medium text-[color:var(--color-text)] transition-colors active:bg-[color:var(--color-bg-input)]"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full border border-[color:var(--color-danger)]/30 px-4 py-3 text-left text-[14px] font-medium text-[color:var(--color-danger)] transition-colors active:bg-[color:var(--color-danger)]/10"
        >
          Delete
        </button>
      </div>
    </Sheet>
  )
}
