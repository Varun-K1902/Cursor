import { useEffect, useRef, useState } from 'react'
import { DEMO_PROMPTS } from '../model/seed'

interface Props {
  onSubmit: (text: string, modality: 'typed' | 'voice' | 'paste') => void
  disabled?: boolean
  lastSummary?: string
  draftText?: string
  onDraftConsumed?: () => void
}

export function ConversationInput({
  onSubmit,
  disabled,
  lastSummary,
  draftText,
  onDraftConsumed,
}: Props) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (draftText != null && draftText !== '') {
      setText(draftText)
      onDraftConsumed?.()
    }
  }, [draftText, onDraftConsumed])

  function submit(modality: 'typed' | 'voice' | 'paste' = 'typed') {
    const t = text.trim()
    if (!t || disabled) return
    onSubmit(t, modality)
    setText('')
  }

  function toggleVoice() {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition

    if (!SR) {
      setText((prev) => prev || 'A nurse searches for a child.')
      onSubmit(
        text.trim() ||
          'Voice input is not available in this browser — using typed modality for the same interpreter.',
        'typed',
      )
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setText(transcript)
        onSubmit(transcript, 'voice')
        setText('')
      }
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  return (
    <div className="conversation-bar">
      {lastSummary && <div className="interpret-summary">{lastSummary}</div>}
      <div className="demo-prompts">
        {DEMO_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="prompt-chip"
            disabled={disabled}
            onClick={() => onSubmit(p, 'typed')}
          >
            {p.length > 64 ? `${p.slice(0, 64)}…` : p}
          </button>
        ))}
      </div>
      <div className="input-row">
        <textarea
          value={text}
          disabled={disabled}
          placeholder="Tell me / type / paste / speak about the process…"
          rows={2}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit('typed')
            }
          }}
        />
        <button
          type="button"
          className={listening ? 'btn-voice active' : 'btn-voice'}
          onClick={toggleVoice}
          disabled={disabled}
          title="Voice input uses the same interpreter as typing"
        >
          {listening ? 'Listening…' : '🎙'}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={disabled || !text.trim()}
          onClick={() => submit('typed')}
        >
          Interpret
        </button>
      </div>
      <p className="fine-print center">
        Conversation is an input method — not the source of truth. Voice and text update the same
        canonical model.
      </p>
    </div>
  )
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}
