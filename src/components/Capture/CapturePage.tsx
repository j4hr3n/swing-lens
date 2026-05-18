import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { commitCapture } from '../../lib/recordings'
import Brackets from '../shared/Brackets'
import { IconBack } from '../shared/Icons'

type Status = 'idle' | 'requesting' | 'preview' | 'recording' | 'saving' | 'error'

function pickMimeType(): { mime: string; ext: string } | undefined {
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime)) {
      return c
    }
  }
  return undefined
}

export default function CapturePage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | undefined>(undefined)
  const recorderRef = useRef<MediaRecorder | undefined>(undefined)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | undefined>()
  const [fps, setFps] = useState<number | undefined>()
  const [dims, setDims] = useState<{ w: number; h: number } | undefined>()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function start() {
      setStatus('requesting')
      try {
        // Ask for the highest realistic frame rate; the browser negotiates
        // down to what the device supports. Note: iOS Safari does not expose
        // AVFoundation's high-speed (240 fps) capture mode through
        // getUserMedia, so iPhone caps at ~60 fps here. Android and desktop
        // webcams may go higher. We never fake the rate via interpolation.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            frameRate: { ideal: 240, min: 30 },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const settings = stream.getVideoTracks()[0]?.getSettings()
        if (settings?.frameRate) setFps(Math.round(settings.frameRate))
        if (settings?.width && settings?.height) setDims({ w: settings.width, h: settings.height })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setStatus('preview')
      } catch (e) {
        if (cancelled) return
        const err = e as Error
        setError(err.message || 'Camera access denied')
        setStatus('error')
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = undefined
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop()
        } catch {
          // ignore
        }
      }
      recorderRef.current = undefined
    }
  }, [])

  useEffect(() => {
    if (status !== 'recording') return
    const id = setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000)
    }, 100)
    return () => clearInterval(id)
  }, [status])

  const startRecording = () => {
    if (!streamRef.current) return
    const pick = pickMimeType()
    if (!pick) {
      setError('Your browser does not support video recording.')
      setStatus('error')
      return
    }
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: pick.mime })
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      void finalize(pick.ext, pick.mime)
    }
    recorder.onerror = (e) => {
      setError((e as ErrorEvent).message ?? 'Recording error')
      setStatus('error')
    }
    recorderRef.current = recorder
    startedAtRef.current = Date.now()
    setElapsed(0)
    recorder.start()
    setStatus('recording')
  }

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    setStatus('saving')
    recorder.stop()
  }

  async function finalize(ext: string, mime: string) {
    try {
      const blob = new Blob(chunksRef.current, { type: mime })
      const settings = streamRef.current?.getVideoTracks()[0]?.getSettings()
      const trackFps = settings?.frameRate ? Math.round(settings.frameRate) : (fps ?? 30)
      const trackW = settings?.width ?? dims?.w ?? 0
      const trackH = settings?.height ?? dims?.h ?? 0
      const durationSec = (Date.now() - startedAtRef.current) / 1000
      const recording = await commitCapture({
        blob,
        ext,
        mime,
        width: trackW,
        height: trackH,
        durationSec,
        fps: trackFps,
      })
      navigate(`/analyzer/${recording.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      setError((e as Error).message || 'Failed to save recording')
      setStatus('error')
    }
  }

  const elapsedFormatted = formatElapsed(elapsed)

  return (
    <div className="no-grain flex h-full flex-col bg-black text-[color:var(--color-text)]">
      <header
        className="flex items-center justify-between gap-2 px-3 pb-2 pt-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 active:bg-white/10 active:text-white"
        >
          <IconBack size={20} />
        </Link>
        <div className="flex items-center gap-2 numeric text-[10px] uppercase tracking-[0.2em] text-white/80">
          {status === 'recording' ? (
            <>
              <span className="flex items-center gap-1.5 text-[color:var(--color-danger)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-danger)] sl-pulse" />
                Rec
              </span>
              <span className="h-3 w-px bg-white/30" />
              <span className="text-white">{elapsedFormatted}</span>
            </>
          ) : (
            <span className="text-white/55">
              {dims ? `${dims.w} × ${dims.h}` : 'Lens'}
              {fps ? <> <span className="mx-1 opacity-60">·</span> {fps} fps</> : null}
            </span>
          )}
        </div>
        <div className="h-11 w-11" />
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="max-h-full max-w-full"
        />
        {status === 'preview' || status === 'recording' ? (
          <Brackets active={status === 'recording'} />
        ) : null}
        {status === 'requesting' ? (
          <p className="absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 sl-pulse">
            Requesting camera…
          </p>
        ) : null}
        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="label-eyebrow text-white">Error</p>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/80">{error}</p>
            <Link to="/" className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
              Back to library
            </Link>
          </div>
        ) : null}
        {status === 'saving' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white sl-pulse">
              Saving clip…
            </p>
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center justify-center py-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {status === 'preview' ? (
          <button
            type="button"
            aria-label="Start recording"
            onClick={startRecording}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/90 transition-transform active:scale-95"
            style={{ boxShadow: '0 0 0 4px rgba(216, 255, 58, 0.0)' }}
          >
            <span className="block h-[58px] w-[58px] rounded-full bg-[color:var(--color-danger)]" />
          </button>
        ) : status === 'recording' ? (
          <button
            type="button"
            aria-label="Stop recording"
            onClick={stopRecording}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/90 transition-transform active:scale-95"
          >
            <span className="block h-9 w-9 rounded-[3px] bg-[color:var(--color-danger)]" />
          </button>
        ) : (
          <div className="h-20 w-20" />
        )}
      </div>
    </div>
  )
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
}
