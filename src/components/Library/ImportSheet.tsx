import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from '../shared/Sheet'
import ChoiceButton from '../shared/ChoiceButton'
import { importRecording } from '../../lib/recordings'
import { isIOS } from '../../lib/platform'
import { IconCamera, IconFile } from '../shared/Icons'

interface ImportSheetProps {
  open: boolean
  onClose: () => void
}

export default function ImportSheet({ open, onClose }: ImportSheetProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(undefined)
    try {
      const { recording, finalizeImport } = await importRecording(file)
      void finalizeImport.catch((err: unknown) => {
        console.error('Background import finalize failed', err)
      })
      onClose()
      void navigate(`/analyzer/${recording.id}`)
    } catch (e) {
      console.error(e)
      setError((e as Error).message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const ios = isIOS()

  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} title="Add a swing">
      <div className="flex flex-col gap-2">
        {ios ? (
          <>
            <ChoiceButton
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              icon={<IconFile size={20} />}
              label="Pick a swing"
              hint="Choose a clip from your camera roll"
            />
            <p className="mt-1 px-1 text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">
              For 120 / 240 fps: open the iPhone Camera, switch to <span className="text-[color:var(--color-text)]">Slo-Mo</span>, record, then come back and pick the clip. Safari can't choose the camera's frame rate, so the in-app "Take Video" option records at standard speed only.
            </p>
          </>
        ) : (
          <>
            <ChoiceButton
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              icon={<IconFile size={20} />}
              label="Import from camera roll"
              hint="From your camera roll. iPhone slo-mo clips keep their original fps."
            />
            <ChoiceButton
              disabled={busy}
              onClick={() => {
                onClose()
                void navigate('/capture')
              }}
              icon={<IconCamera size={20} />}
              label="Record now"
              hint="Direct capture — up to 120 fps on Android, ~60 fps on desktop."
            />
          </>
        )}
      </div>
      {busy ? (
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sl-pulse">
          Reading source…
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-center text-[12px] text-[color:var(--color-danger)]">{error}</p>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />
    </Sheet>
  )
}
