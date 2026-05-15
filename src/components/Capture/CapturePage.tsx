import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { writeFile } from '../../lib/opfs'
import { probeVideo } from '../../lib/videoMeta'
import { db } from '../../lib/db'
import { uid } from '../../lib/geometry'
import type { Recording } from '../../types'

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
  const [elapsed, setElapsed] = useState(0)

  // Acquire camera on mount
  useEffect(() => {
    let cancelled = false
    async function start() {
      setStatus('requesting')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            frameRate: { ideal: 60 },
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

  // Elapsed timer while recording
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
      const file = new File([blob], `capture.${ext}`, { type: mime })
      const { meta, thumbnail } = await probeVideo(file)
      const id = uid()
      const videoFileName = `${id}.${ext}`
      const thumbnailFileName = `${id}.jpg`
      await writeFile(videoFileName, file)
      await writeFile(thumbnailFileName, thumbnail)
      const now = new Date()
      const recording: Recording = {
        id,
        name: `Swing — ${format(now, 'MMM d, yyyy HH:mm')}`,
        videoFileName,
        thumbnailFileName,
        fps: meta.fps,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        createdAt: now.getTime(),
        annotations: [],
      }
      await db.recordings.add(recording)
      navigate(`/analyzer/${id}`, { replace: true })
    } catch (e) {
      console.error(e)
      setError((e as Error).message || 'Failed to save recording')
      setStatus('error')
    }
  }

  return (
    <div className="flex h-full flex-col bg-black text-[color:var(--color-text)]">
      <header
        className="flex items-center justify-between gap-2 px-2 pb-1 pt-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 active:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15,6 9,12 15,18" />
          </svg>
        </Link>
        <div className="flex flex-col items-center text-[11px] text-white/70">
          {status === 'recording' ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="tabular-nums">{elapsed.toFixed(1)}s</span>
            </span>
          ) : fps ? (
            <span className="tabular-nums">{fps}fps preview</span>
          ) : null}
        </div>
        <div className="h-10 w-10" />
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="max-h-full max-w-full"
        />
        {status === 'requesting' ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Requesting camera…
          </p>
        ) : null}
        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm">{error}</p>
            <Link to="/" className="mt-4 text-sm text-[color:var(--color-accent)] underline">
              Back to library
            </Link>
          </div>
        ) : null}
        {status === 'saving' ? (
          <p className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            Saving…
          </p>
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
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white active:scale-95"
          >
            <span className="block h-14 w-14 rounded-full bg-red-500" />
          </button>
        ) : status === 'recording' ? (
          <button
            type="button"
            aria-label="Stop recording"
            onClick={stopRecording}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white active:scale-95"
          >
            <span className="block h-9 w-9 rounded-md bg-red-500" />
          </button>
        ) : (
          <div className="h-20 w-20" />
        )}
      </div>
    </div>
  )
}
