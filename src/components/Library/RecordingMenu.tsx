import Sheet from '../shared/Sheet'
import ChoiceButton from '../shared/ChoiceButton'
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
        <ChoiceButton label="Rename" onClick={onRename} />
        <ChoiceButton label="Delete" danger onClick={onDelete} />
      </div>
    </Sheet>
  )
}
