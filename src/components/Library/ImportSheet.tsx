import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from '../shared/Sheet'
import { importRecording } from '../../lib/recordings'
import { isIOS } from '../../lib/platform'
import { IconArrowRight, IconCamera, IconFile } from '../shared/Icons'

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
      const { recording } = await importRecording(file)
      onClose()
      navigate(`/analyzer/${recording.id}`)
    } catch (e) {
      console.error(e)
      setError((e as Error).message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const ios = isIOS()

  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} kicker="New" title="Add a swing">
      <div className="flex flex-col gap-2">
        {ios ? (
          <>
            <ChoiceButton
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              icon={<IconCamera size={20} />}
              label="Record slow-mo"
              hint="Open Camera, switch to Slo-Mo, record, then pick the clip here"
            />
            <ChoiceButton
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              icon={<IconFile size={20} />}
              label="Choose existing clip"
              hint="Pick a swing already in your camera roll"
            />
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
                navigate('/capture')
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

function ChoiceButton({
  disabled,
  onClick,
  icon,
  label,
  hint,
}: {
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-center gap-3 border border-[color:var(--color-border)] bg-transparent px-4 py-3.5 text-left transition-colors active:bg-[color:var(--color-bg-input)] disabled:opacity-50"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-[color:var(--color-border)] text-[color:var(--color-text)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-[color:var(--color-text)]">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">
          {hint}
        </span>
      </span>
      <span className="flex-shrink-0 text-[color:var(--color-text-muted)] transition-transform group-active:translate-x-0.5">
        <IconArrowRight size={16} />
      </span>
    </button>
  )
}
