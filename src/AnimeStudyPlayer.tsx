import 'xgplayer/dist/index.min.css'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import type {
  AnimeStudyPlayerHandle,
  AnimeStudyPlayerProps,
  StudyKnowledgePoint,
  StudyPlayerSnapshot,
  StudyTranscriptSegment,
} from './types.js'

type XgPlayerInstance = import('xgplayer').default
type XgPlayerCtor = typeof import('xgplayer').default

const STYLE_ID = 'anime-study-player-style'
const SUBTITLE_SCALE_OPTIONS = [
  { label: '小', value: 0.9 },
  { label: '标准', value: 1 },
  { label: '大', value: 1.15 },
  { label: '超大', value: 1.3 },
] as const

const styleText = `
.asp-shell{--asp-subtitle-scale:1;position:relative;width:100%;display:grid;gap:12px}
.asp-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:240px;max-height:min(68svh,720px);overflow:hidden;border-radius:28px;background:#130d0b;box-shadow:0 24px 48px rgba(20,12,10,.18)}
.asp-host{position:absolute;inset:0}
.asp-stage .xgplayer{width:100%;height:100%;background:#000;border-radius:inherit}
.asp-stage .xgplayer video{object-fit:contain}
.asp-stage .xgplayer .xgplayer-controls{height:54px;background-image:linear-gradient(180deg,rgba(10,7,6,0),rgba(10,7,6,.22),rgba(10,7,6,.76),rgba(10,7,6,.92));backdrop-filter:blur(18px)}
.asp-stage .xgplayer .xg-inner-controls{height:46px;bottom:2px}
.asp-stage .xgplayer .xgplayer-progress{height:24px}
.asp-stage .xgplayer .xgplayer-progress-outer{height:4px;border-radius:999px}
.asp-stage .xgplayer.xgplayer-pc .xgplayer-progress.active .xgplayer-progress-outer{height:8px;margin-bottom:2px}
.asp-stage .xgplayer .xgplayer-progress-played,.asp-stage .xgplayer .xg-mini-progress-show xg-mini-progress-played,.asp-stage .xgplayer .xg-mini-progress xg-mini-progress-played{background:linear-gradient(90deg,#ffc3a3,#ffe3a6 55%,#cdebd8)!important}
.asp-stage .xgplayer .xgplayer-progress-cache,.asp-stage .xgplayer .xg-mini-progress xg-mini-progress-cache{background:rgba(255,255,255,.32)!important}
.asp-stage .xgplayer .xgplayer-progress-btn{background:rgba(255,200,174,.38);box-shadow:0 0 0 1px rgba(255,255,255,.16)}
.asp-stage .xgplayer .xgplayer-progress-btn:before{background:#fffaf6}
.asp-stage .xgplayer .xgplayer-time{color:#fffaf6;font-weight:600}
.asp-stage .xgplayer .time-duration{color:rgba(255,250,246,.64)}
.asp-stage .xgplayer xg-icon{color:#fffaf6;fill:#fffaf6}
.asp-stage .xgplayer xg-icon:hover{opacity:.86}
.asp-stage .xgplayer .xg-options-list{background:rgba(17,12,10,.88);border-radius:16px;backdrop-filter:blur(18px);padding:6px 0}
.asp-stage .xgplayer .xg-options-list li{color:rgba(255,248,243,.88)}
.asp-stage .xgplayer .xg-options-list li:hover,.asp-stage .xgplayer .xg-options-list li.selected{color:#ffd4bf}
.asp-stage .xgplayer .xgplayer-slider{background:rgba(17,12,10,.82);border-radius:18px;backdrop-filter:blur(16px)}
.asp-stage .xgplayer .xgplayer-drag{background:linear-gradient(180deg,#ffc3a3,#cdebd8)}
.asp-floatingTools{position:absolute;top:14px;right:14px;z-index:18;display:flex;gap:10px;flex-wrap:wrap}
.asp-toolButton{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;color:#fffaf6;background:rgba(17,12,10,.42);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(16px);cursor:pointer}
.asp-toolButton strong{font-size:.92rem;font-weight:700}
.asp-subtitleCard{position:absolute;left:14px;right:14px;bottom:82px;z-index:17;max-width:min(88%,860px);margin-inline:auto;padding:12px 14px;border-radius:22px;background:rgba(14,9,8,.46);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);box-shadow:0 16px 28px rgba(18,12,10,.24);pointer-events:none}
.asp-subtitleLabel{display:inline-flex;margin-bottom:6px;padding:4px 10px;border-radius:999px;color:rgba(255,248,243,.86);background:rgba(255,255,255,.12);font-size:12px}
.asp-subtitleJa{display:block;color:#fffaf6;font-size:calc(clamp(1.06rem,1.7vw,1.36rem) * var(--asp-subtitle-scale));line-height:1.55;font-weight:700}
.asp-subtitleMeta,.asp-subtitleZh{display:block;margin-top:4px;color:rgba(255,246,241,.84);line-height:1.55;font-size:calc(.92rem * var(--asp-subtitle-scale))}
.asp-markWord,.asp-markGrammar{padding:.06em .22em;border-radius:.4em;color:#442f28}
.asp-markWord{background:linear-gradient(120deg,rgba(255,215,176,.98),rgba(255,237,191,.98))}
.asp-markGrammar{background:linear-gradient(120deg,rgba(205,234,221,.98),rgba(181,224,237,.98))}
.asp-errorCard{position:absolute;left:50%;top:50%;z-index:19;display:grid;gap:8px;width:min(82%,440px);padding:16px 18px;border-radius:22px;color:#fffaf6;background:rgba(22,14,12,.84);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(18px);transform:translate(-50%,-50%)}
.asp-errorCard strong{font-size:1rem}
.asp-errorCard span{color:rgba(255,246,241,.82);line-height:1.6}
.asp-hud{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-radius:18px;background:rgba(255,255,255,.82);border:1px solid rgba(238,223,213,.9);color:#7d6255}
.asp-hud strong{color:#49342c;font-size:1rem}
.asp-hud span{line-height:1.6}
@media (max-width:720px){
  .asp-stage{min-height:220px;aspect-ratio:16/10;border-radius:24px}
  .asp-floatingTools{top:12px;right:12px;left:12px;justify-content:flex-end}
  .asp-toolButton{padding:9px 12px}
  .asp-subtitleCard{left:12px;right:12px;bottom:72px;padding:10px 12px;border-radius:20px;max-width:calc(100% - 24px)}
  .asp-hud{flex-direction:column;align-items:flex-start}
}
`

function ensureStyle() {
  if (typeof document === 'undefined') {
    return
  }

  if (document.getElementById(STYLE_ID)) {
    return
  }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = styleText
  document.head.appendChild(style)
}

function getCurrentSegment(segments: StudyTranscriptSegment[], currentMs: number) {
  return segments.find((segment) => currentMs >= segment.startMs && currentMs < segment.endMs)
}

function getActivePoints(points: StudyKnowledgePoint[], segment?: StudyTranscriptSegment) {
  if (!segment) {
    return []
  }

  const ids = new Set(segment.focusTermIds)
  return points.filter((point) => ids.has(point.id))
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(text: string, points: StudyKnowledgePoint[]): ReactNode {
  if (!text) {
    return text
  }

  const matches = points
    .filter((point) => point.expression.trim())
    .flatMap((point) => {
      const regex = new RegExp(escapeRegExp(point.expression), 'g')
      const result: Array<{ start: number; end: number; point: StudyKnowledgePoint }> = []
      let match = regex.exec(text)

      while (match) {
        result.push({
          start: match.index,
          end: match.index + match[0].length,
          point,
        })

        if (regex.lastIndex === match.index) {
          regex.lastIndex += 1
        }

        match = regex.exec(text)
      }

      return result
    })
    .sort((left, right) => {
      if (left.start !== right.start) {
        return left.start - right.start
      }

      return right.end - left.end
    })

  if (matches.length === 0) {
    return text
  }

  const accepted: typeof matches = []
  let cursor = -1
  for (const match of matches) {
    if (match.start < cursor) {
      continue
    }

    accepted.push(match)
    cursor = match.end
  }

  const nodes: ReactNode[] = []
  let lastIndex = 0
  for (const match of accepted) {
    if (match.start > lastIndex) {
      nodes.push(text.slice(lastIndex, match.start))
    }

    nodes.push(
      <mark
        key={`${match.point.id}-${match.start}`}
        className={match.point.kind === 'grammar' ? 'asp-markGrammar' : 'asp-markWord'}
      >
        {text.slice(match.start, match.end)}
      </mark>,
    )
    lastIndex = match.end
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function formatClock(valueMs: number) {
  const totalSeconds = Math.max(0, Math.round(valueMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function createSnapshot(
  elapsedMs: number,
  absoluteMs: number,
  durationMs: number,
  isReady: boolean,
  isPlaying: boolean,
  isBuffering: boolean,
  isAutoplayBlocked: boolean,
  volume: number,
  segments: StudyTranscriptSegment[],
  knowledgePoints: StudyKnowledgePoint[],
): StudyPlayerSnapshot {
  const currentSegment = getCurrentSegment(segments, elapsedMs)
  return {
    elapsedMs,
    absoluteMs,
    durationMs,
    isReady,
    isPlaying,
    isBuffering,
    isAutoplayBlocked,
    volume,
    currentSegment,
    activePoints: getActivePoints(knowledgePoints, currentSegment),
  }
}

function getSubtitleScaleLabel(value: number) {
  return SUBTITLE_SCALE_OPTIONS.find((option) => option.value === value)?.label ?? '标准'
}

export const AnimeStudyPlayer = forwardRef<AnimeStudyPlayerHandle, AnimeStudyPlayerProps>(
  function AnimeStudyPlayer(
    {
      url,
      poster,
      title,
      sourceLabel,
      durationMs,
      clipStartMs = 0,
      clipEndMs,
      segments,
      knowledgePoints,
      showRomaji = true,
      showSubtitleReading = false,
      autoplay = true,
      themeColor = '#ffc8af',
      className,
      onFinish,
      onError,
      onReady,
      onStateChange,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null)
    const playerRef = useRef<XgPlayerInstance | null>(null)
    const finishedRef = useRef(false)
    const subtitleVisibleRef = useRef(true)
    const subtitleScaleRef = useRef(1)
    const renderedFrameRef = useRef(false)
    const snapshotRef = useRef<StudyPlayerSnapshot>(
      createSnapshot(0, clipStartMs, durationMs, false, false, true, false, 0.8, segments, knowledgePoints),
    )
    const onFinishRef = useRef(onFinish)
    const onErrorRef = useRef(onError)
    const onReadyRef = useRef(onReady)
    const onStateChangeRef = useRef(onStateChange)
    const effectiveClipEndMs = clipEndMs ?? clipStartMs + durationMs
    const [subtitleVisible, setSubtitleVisible] = useState(true)
    const [subtitleScale, setSubtitleScale] = useState(1)
    const [playerError, setPlayerError] = useState<string | null>(null)
    const [snapshot, setSnapshot] = useState<StudyPlayerSnapshot>(() => snapshotRef.current)
    const shellStyle = useMemo(
      () =>
        ({
          ['--asp-subtitle-scale' as '--asp-subtitle-scale']: String(subtitleScale),
        }) as CSSProperties,
      [subtitleScale],
    )

    const initialSnapshot = useMemo(
      () =>
        createSnapshot(
          0,
          clipStartMs,
          durationMs,
          false,
          false,
          true,
          false,
          0.8,
          segments,
          knowledgePoints,
        ),
      [clipStartMs, durationMs, knowledgePoints, segments],
    )

    useEffect(() => {
      onFinishRef.current = onFinish
      onErrorRef.current = onError
      onReadyRef.current = onReady
      onStateChangeRef.current = onStateChange
    }, [onError, onFinish, onReady, onStateChange])

    useEffect(() => {
      ensureStyle()
    }, [])

    useEffect(() => {
      snapshotRef.current = initialSnapshot
      setSnapshot(initialSnapshot)
      setPlayerError(null)
      renderedFrameRef.current = false
    }, [initialSnapshot])

    useEffect(() => {
      const host = hostRef.current
      if (!host) {
        return
      }

      finishedRef.current = false
      renderedFrameRef.current = false
      setPlayerError(null)
      host.innerHTML = ''

      let disposed = false
      let cleanupMediaListeners: (() => void) | null = null

      const initializePlayer = async () => {
        const module = await import('xgplayer')
        if (disposed) {
          return
        }

        const Player = module.default as unknown as XgPlayerCtor
        const player = new Player({
          el: host,
          url,
          poster,
          width: '100%',
          height: '100%',
          fluid: true,
          autoplay: false,
          autoplayMuted: false,
          volume: snapshotRef.current.volume,
          playsinline: true,
          videoFillMode: 'contain',
          closeVideoClick: false,
          closeVideoDblclick: false,
          closeControlsBlur: false,
          closeDelayBlur: false,
          inactive: 1800,
          pip: true,
          cssFullscreen: true,
          screenShot: true,
          rotate: false,
          download: false,
          mini: false,
          keyShortcut: true,
          miniprogress: true,
          playbackRate: [0.75, 1, 1.25, 1.5, 2],
          commonStyle: {
            progressColor: '#ffe2ad',
            playedColor: themeColor,
            cachedColor: 'rgba(255,255,255,0.28)',
            volumeColor: '#cdebd8',
          },
          videoAttributes: {
            preload: 'auto',
            playsinline: 'true',
            webkitPlaysinline: 'true',
            x5Playsinline: 'true',
            x5VideoPlayerType: 'h5',
            crossOrigin: 'anonymous',
          },
          controls: {
            mode: 'flex',
            initShow: true,
            autoHide: true,
          },
        })

        playerRef.current = player
        player.volume = snapshotRef.current.volume

        const media = player.media as HTMLVideoElement | null
        if (!media || typeof media.addEventListener !== 'function') {
          throw new Error('播放器视频内核没有正确初始化。')
        }

        const emitSnapshot = (patch?: Partial<StudyPlayerSnapshot>) => {
          const absoluteMs = Math.round(player.currentTime * 1000)
          const elapsedMs = Math.min(durationMs, Math.max(0, absoluteMs - clipStartMs))
          const next = {
            ...createSnapshot(
              elapsedMs,
              absoluteMs,
              durationMs,
              snapshotRef.current.isReady || media.readyState >= 2,
              !media.paused && !media.ended,
              snapshotRef.current.isBuffering,
              snapshotRef.current.isAutoplayBlocked,
              player.volume,
              segments,
              knowledgePoints,
            ),
            ...patch,
          }

          snapshotRef.current = next
          setSnapshot(next)
          onStateChangeRef.current?.(next)
          return next
        }

        const markRenderedFrame = () => {
          if (renderedFrameRef.current) {
            return
          }

          if (media.videoWidth > 0 && media.videoHeight > 0) {
            renderedFrameRef.current = true
          }
        }

        const watchVideoFrame = () => {
          if (typeof media.requestVideoFrameCallback === 'function') {
            const handle = media.requestVideoFrameCallback(() => {
              markRenderedFrame()
            })

            return () => {
              if (typeof media.cancelVideoFrameCallback === 'function') {
                media.cancelVideoFrameCallback(handle)
              }
            }
          }

          const timeoutId = window.setTimeout(() => {
            markRenderedFrame()
          }, 80)

          return () => {
            window.clearTimeout(timeoutId)
          }
        }

        let cancelFrameWatch: (() => void) | null = null

        const tryPlay = (fromBeginning = false) => {
          const startSec = clipStartMs / 1000
          const endSec = effectiveClipEndMs / 1000
          const outsideSlice = player.currentTime < startSec || player.currentTime > endSec

          if (fromBeginning || outsideSlice) {
            player.currentTime = startSec
            finishedRef.current = false
            emitSnapshot({ elapsedMs: 0, absoluteMs: clipStartMs })
          }

          const attempt = player.play()
          if (attempt && typeof attempt.then === 'function') {
            void attempt
              .then(() => {
                emitSnapshot({ isAutoplayBlocked: false, isBuffering: false })
              })
              .catch(() => {
                emitSnapshot({ isAutoplayBlocked: true, isPlaying: false, isBuffering: false })
              })
          }
        }

        const handleLoadedMetadata = () => {
          const startSec = clipStartMs / 1000
          if (Math.abs(player.currentTime - startSec) > 0.1) {
            player.currentTime = startSec
          }

          emitSnapshot({
            elapsedMs: 0,
            absoluteMs: clipStartMs,
            isReady: true,
            isBuffering: false,
          })
          onReadyRef.current?.()

          if (autoplay) {
            window.requestAnimationFrame(() => {
              tryPlay()
            })
          }
        }

        const handleTimeUpdate = () => {
          markRenderedFrame()
          const absoluteMs = Math.round(player.currentTime * 1000)
          if (absoluteMs >= effectiveClipEndMs) {
            player.pause()
            const finalState = emitSnapshot({
              elapsedMs: durationMs,
              absoluteMs: effectiveClipEndMs,
              isPlaying: false,
              isBuffering: false,
            })

            if (!finishedRef.current) {
              finishedRef.current = true
              onStateChangeRef.current?.(finalState)
              onFinishRef.current?.()
            }
            return
          }

          emitSnapshot()
        }

        const handleSeeked = () => {
          const absoluteMs = Math.round(player.currentTime * 1000)
          if (absoluteMs < clipStartMs) {
            player.currentTime = clipStartMs / 1000
            return
          }

          if (absoluteMs > effectiveClipEndMs) {
            player.currentTime = effectiveClipEndMs / 1000
          }

          emitSnapshot({ isBuffering: false })
        }

        const handlePlayerError = () => {
          emitSnapshot({ isBuffering: false, isPlaying: false })
          const message =
            '当前视频浏览器无法正常解码播放。请优先使用 MP4(H.264/AAC) 或 WebM 格式。'
          setPlayerError(message)
          onErrorRef.current?.(message)
        }

        const missingPictureGuard = () => {
          if (
            !renderedFrameRef.current &&
            player.currentTime > Math.max(clipStartMs / 1000 + 0.4, 0.4) &&
            media.readyState >= 2 &&
            media.videoWidth === 0
          ) {
            player.pause()
            const message =
              '当前文件已经开始播放音频，但画面没有正常解码。系统建议先转成 MP4(H.264/AAC) 再播放。'
            setPlayerError(message)
            onErrorRef.current?.(message)
          }
        }

        const loadStart = () => emitSnapshot({ isReady: false, isBuffering: true })
        const loadedData = () => {
          cancelFrameWatch?.()
          cancelFrameWatch = watchVideoFrame()
        }
        const canPlay = () => emitSnapshot({ isReady: true, isBuffering: false })
        const playing = () =>
          emitSnapshot({
            isReady: true,
            isPlaying: true,
            isBuffering: false,
            isAutoplayBlocked: false,
          })
        const paused = () => emitSnapshot({ isPlaying: false })
        const waiting = () => emitSnapshot({ isBuffering: true })
        const seeking = () => emitSnapshot({ isBuffering: true })
        const volumeChange = () => emitSnapshot({ volume: media.volume })

        media.addEventListener('loadstart', loadStart)
        media.addEventListener('loadedmetadata', handleLoadedMetadata)
        media.addEventListener('loadeddata', loadedData)
        media.addEventListener('canplay', canPlay)
        media.addEventListener('playing', playing)
        media.addEventListener('pause', paused)
        media.addEventListener('waiting', waiting)
        media.addEventListener('seeking', seeking)
        media.addEventListener('seeked', handleSeeked)
        media.addEventListener('timeupdate', handleTimeUpdate)
        media.addEventListener('timeupdate', missingPictureGuard)
        media.addEventListener('volumechange', volumeChange)
        media.addEventListener('error', handlePlayerError)

        cleanupMediaListeners = () => {
          cancelFrameWatch?.()
          media.removeEventListener('loadstart', loadStart)
          media.removeEventListener('loadedmetadata', handleLoadedMetadata)
          media.removeEventListener('loadeddata', loadedData)
          media.removeEventListener('canplay', canPlay)
          media.removeEventListener('playing', playing)
          media.removeEventListener('pause', paused)
          media.removeEventListener('waiting', waiting)
          media.removeEventListener('seeking', seeking)
          media.removeEventListener('seeked', handleSeeked)
          media.removeEventListener('timeupdate', handleTimeUpdate)
          media.removeEventListener('timeupdate', missingPictureGuard)
          media.removeEventListener('volumechange', volumeChange)
          media.removeEventListener('error', handlePlayerError)
        }
      }

      void initializePlayer().catch((error) => {
        console.error(error)
        const message = '播放器初始化失败，请稍后重试。'
        setPlayerError(message)
        onErrorRef.current?.(message)
      })

      return () => {
        disposed = true
        cleanupMediaListeners?.()
        playerRef.current?.destroy()
        playerRef.current = null
      }
    }, [
      autoplay,
      clipStartMs,
      durationMs,
      effectiveClipEndMs,
      knowledgePoints,
      poster,
      segments,
      themeColor,
      url,
    ])

    useImperativeHandle(
      ref,
      () => ({
        play() {
          void playerRef.current?.play()
        },
        pause() {
          playerRef.current?.pause()
        },
        toggle() {
          const player = playerRef.current
          const media = player?.media as HTMLVideoElement | null
          if (!player || !media) {
            return
          }

          if (media.paused) {
            void player.play()
            return
          }

          player.pause()
        },
        restart() {
          const player = playerRef.current
          if (!player) {
            return
          }

          finishedRef.current = false
          player.currentTime = clipStartMs / 1000
          void player.play()
        },
        seekTo(nextElapsedMs: number) {
          const player = playerRef.current
          if (!player) {
            return
          }

          const clamped = Math.min(durationMs, Math.max(0, nextElapsedMs))
          player.currentTime = (clipStartMs + clamped) / 1000
        },
        setVolume(nextVolume: number) {
          const player = playerRef.current
          if (!player) {
            return
          }

          player.volume = Math.min(1, Math.max(0, nextVolume))
        },
        getState() {
          return snapshotRef.current
        },
      }),
      [clipStartMs, durationMs],
    )

    const overlayText = snapshot.currentSegment
      ? showRomaji
        ? `${snapshot.currentSegment.kana} / ${snapshot.currentSegment.romaji}`
        : snapshot.currentSegment.kana
      : ''

    const subtitleScaleLabel = getSubtitleScaleLabel(subtitleScale)

    return (
      <div className={className ? `asp-shell ${className}` : 'asp-shell'} style={shellStyle}>
        <div className="asp-stage">
          <div ref={hostRef} className="asp-host" />

          <div className="asp-floatingTools">
            <button
              type="button"
              className="asp-toolButton"
              onClick={() => {
                const next = !subtitleVisibleRef.current
                subtitleVisibleRef.current = next
                setSubtitleVisible(next)
              }}
            >
              <strong>{subtitleVisible ? '隐藏字幕' : '显示字幕'}</strong>
            </button>

            <button
              type="button"
              className="asp-toolButton"
              onClick={() => {
                const currentIndex = SUBTITLE_SCALE_OPTIONS.findIndex(
                  (option) => option.value === subtitleScaleRef.current,
                )
                const nextIndex = (currentIndex + 1) % SUBTITLE_SCALE_OPTIONS.length
                const nextValue = SUBTITLE_SCALE_OPTIONS[nextIndex].value
                subtitleScaleRef.current = nextValue
                setSubtitleScale(nextValue)
              }}
            >
              <strong>字幕大小 {subtitleScaleLabel}</strong>
            </button>
          </div>

          {subtitleVisible && snapshot.currentSegment ? (
            <div className="asp-subtitleCard">
              <span className="asp-subtitleLabel">
                {title || 'Study Clip'}
                {sourceLabel ? ` / ${sourceLabel}` : ''}
              </span>
              <strong className="asp-subtitleJa">
                {renderHighlightedText(snapshot.currentSegment.ja, snapshot.activePoints)}
              </strong>
              {showSubtitleReading && overlayText ? (
                <span className="asp-subtitleMeta">{overlayText}</span>
              ) : null}
              <span className="asp-subtitleZh">{snapshot.currentSegment.zh}</span>
            </div>
          ) : null}

          {playerError ? (
            <div className="asp-errorCard">
              <strong>视频暂时无法播放</strong>
              <span>{playerError}</span>
            </div>
          ) : null}
        </div>

        <div className="asp-hud">
          <span>
            {sourceLabel || '本地原片'} / {snapshot.isPlaying ? '播放中' : snapshot.isBuffering ? '缓冲中' : '已暂停'}
          </span>
          <strong>
            {formatClock(snapshot.elapsedMs)} / {formatClock(durationMs)}
          </strong>
        </div>
      </div>
    )
  },
)
