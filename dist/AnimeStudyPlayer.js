import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, } from 'react';
const STYLE_ID = 'anime-study-player-style';
const SUBTITLE_SCALE_OPTIONS = [
    { label: '小', value: 0.9 },
    { label: '标准', value: 1 },
    { label: '大', value: 1.15 },
    { label: '超大', value: 1.3 },
];
const styleText = `
.asp-shell{--asp-subtitle-scale:1;position:relative;width:100%;display:grid;gap:12px}
.asp-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:240px;max-height:min(64svh,680px);overflow:hidden;border-radius:28px;background:#130d0b;box-shadow:0 20px 40px rgba(20,12,10,.18)}
.asp-stage .art-video-player{width:100%;height:100%}
.asp-stage .art-video,.asp-stage video{width:100%;height:100%;object-fit:contain;background:#000}
.asp-stage .art-bottom{z-index:12}
.asp-stage .art-settings{z-index:14}
.asp-subtitle-card{position:absolute;left:14px;right:14px;bottom:76px;z-index:11;max-width:min(88%,820px);margin-inline:auto;padding:12px 14px;border-radius:22px;background:rgba(14,9,8,.42);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);box-shadow:0 16px 28px rgba(18,12,10,.24);pointer-events:none}
.asp-subtitle-label{display:inline-flex;margin-bottom:6px;padding:4px 10px;border-radius:999px;color:rgba(255,248,243,.86);background:rgba(255,255,255,.12);font-size:12px}
.asp-subtitle-ja{display:block;color:#fffaf6;font-size:calc(clamp(1.04rem,1.6vw,1.32rem) * var(--asp-subtitle-scale));line-height:1.5;font-weight:700}
.asp-subtitle-meta,.asp-subtitle-zh{display:block;margin-top:4px;color:rgba(255,246,241,.84);line-height:1.55;font-size:calc(.9rem * var(--asp-subtitle-scale))}
.asp-mark-word,.asp-mark-grammar{padding:.06em .22em;border-radius:.4em;color:#442f28}
.asp-mark-word{background:linear-gradient(120deg,rgba(255,215,176,.98),rgba(255,237,191,.98))}
.asp-mark-grammar{background:linear-gradient(120deg,rgba(205,234,221,.98),rgba(181,224,237,.98))}
.asp-overlay-button,.asp-status{position:absolute;left:50%;top:50%;z-index:10;transform:translate(-50%,-50%)}
.asp-overlay-button{display:inline-flex;align-items:center;gap:10px;padding:14px 20px;border-radius:999px;color:#fffaf6;background:rgba(20,13,11,.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.26);cursor:pointer}
.asp-status{padding:10px 14px;border-radius:999px;color:#fffaf6;background:rgba(20,13,11,.62);backdrop-filter:blur(14px);pointer-events:none}
.asp-error-card{position:absolute;left:50%;top:50%;z-index:15;display:grid;gap:8px;width:min(82%,440px);padding:16px 18px;border-radius:22px;color:#fffaf6;background:rgba(22,14,12,.84);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(18px);transform:translate(-50%,-50%)}
.asp-error-card strong{font-size:1rem}
.asp-error-card span{color:rgba(255,246,241,.82);line-height:1.6}
.asp-hud{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-radius:18px;background:rgba(255,255,255,.82);border:1px solid rgba(238,223,213,.9);color:#7d6255}
.asp-hud strong{color:#49342c;font-size:1rem}
.asp-shell .art-bottom{backdrop-filter:blur(10px)}
.asp-shell .art-control{color:#fffaf6}
.asp-shell .art-progress{height:5px}
.asp-shell .art-progress-loaded{background:rgba(255,255,255,.22)}
.asp-shell .art-progress-played{background:linear-gradient(90deg,#ffc8af,#ffe4a8,#c8ead8)}
.asp-shell .art-highlight span{background:#ffc8af}
@media (max-width:720px){
  .asp-stage{min-height:220px;aspect-ratio:16/10;border-radius:24px}
  .asp-subtitle-card{left:12px;right:12px;bottom:72px;padding:10px 12px;border-radius:20px;max-width:calc(100% - 24px)}
  .asp-hud{flex-direction:column;align-items:flex-start}
}
`;
function ensureStyle() {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = styleText;
    document.head.appendChild(style);
}
function getCurrentSegment(segments, currentMs) {
    return segments.find((segment) => currentMs >= segment.startMs && currentMs < segment.endMs);
}
function getActivePoints(points, segment) {
    if (!segment) {
        return [];
    }
    const ids = new Set(segment.focusTermIds);
    return points.filter((point) => ids.has(point.id));
}
function escapeRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function renderHighlightedText(text, points) {
    if (!text) {
        return text;
    }
    const matches = points
        .filter((point) => point.expression.trim())
        .flatMap((point) => {
        const regex = new RegExp(escapeRegExp(point.expression), 'g');
        const result = [];
        let match = regex.exec(text);
        while (match) {
            result.push({
                start: match.index,
                end: match.index + match[0].length,
                point,
            });
            if (regex.lastIndex === match.index) {
                regex.lastIndex += 1;
            }
            match = regex.exec(text);
        }
        return result;
    })
        .sort((left, right) => {
        if (left.start !== right.start) {
            return left.start - right.start;
        }
        return right.end - left.end;
    });
    if (matches.length === 0) {
        return text;
    }
    const accepted = [];
    let cursor = -1;
    for (const match of matches) {
        if (match.start < cursor) {
            continue;
        }
        accepted.push(match);
        cursor = match.end;
    }
    const nodes = [];
    let lastIndex = 0;
    for (const match of accepted) {
        if (match.start > lastIndex) {
            nodes.push(text.slice(lastIndex, match.start));
        }
        nodes.push(_jsx("mark", { className: match.point.kind === 'grammar' ? 'asp-mark-grammar' : 'asp-mark-word', children: text.slice(match.start, match.end) }, `${match.point.id}-${match.start}`));
        lastIndex = match.end;
    }
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }
    return nodes;
}
function formatClock(valueMs) {
    const totalSeconds = Math.max(0, Math.round(valueMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
function createSnapshot(elapsedMs, absoluteMs, durationMs, isReady, isPlaying, isBuffering, isAutoplayBlocked, volume, segments, knowledgePoints) {
    const currentSegment = getCurrentSegment(segments, elapsedMs);
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
    };
}
export const AnimeStudyPlayer = forwardRef(function AnimeStudyPlayer({ url, poster, title, sourceLabel, durationMs, clipStartMs = 0, clipEndMs, segments, knowledgePoints, showRomaji = true, autoplay = true, themeColor = '#ffc8af', className, onFinish, onError, onReady, onStateChange, }, ref) {
    const hostRef = useRef(null);
    const artRef = useRef(null);
    const finishedRef = useRef(false);
    const subtitleVisibleRef = useRef(true);
    const subtitleScaleRef = useRef(1);
    const snapshotRef = useRef(createSnapshot(0, clipStartMs, durationMs, false, false, true, false, 0.8, segments, knowledgePoints));
    const onFinishRef = useRef(onFinish);
    const onErrorRef = useRef(onError);
    const onReadyRef = useRef(onReady);
    const onStateChangeRef = useRef(onStateChange);
    const effectiveClipEndMs = clipEndMs ?? clipStartMs + durationMs;
    const [subtitleVisible, setSubtitleVisible] = useState(true);
    const [subtitleScale, setSubtitleScale] = useState(1);
    const [playerError, setPlayerError] = useState(null);
    const [snapshot, setSnapshot] = useState(() => snapshotRef.current);
    const shellStyle = useMemo(() => ({
        ['--asp-subtitle-scale']: String(subtitleScale),
    }), [subtitleScale]);
    const initialSnapshot = useMemo(() => createSnapshot(0, clipStartMs, durationMs, false, false, true, false, 0.8, segments, knowledgePoints), [clipStartMs, durationMs, knowledgePoints, segments]);
    useEffect(() => {
        onFinishRef.current = onFinish;
        onErrorRef.current = onError;
        onReadyRef.current = onReady;
        onStateChangeRef.current = onStateChange;
    }, [onError, onFinish, onReady, onStateChange]);
    useEffect(() => {
        ensureStyle();
    }, []);
    useEffect(() => {
        snapshotRef.current = initialSnapshot;
        setSnapshot(initialSnapshot);
        setPlayerError(null);
    }, [initialSnapshot]);
    useEffect(() => {
        const host = hostRef.current;
        if (!host) {
            return;
        }
        finishedRef.current = false;
        host.innerHTML = '';
        setPlayerError(null);
        let disposed = false;
        let cleanupListeners = null;
        void import('artplayer')
            .then((module) => {
            if (disposed) {
                return;
            }
            const Artplayer = module.default;
            const art = new Artplayer({
                container: host,
                url,
                poster,
                theme: themeColor,
                autoplay: false,
                mutex: true,
                autoSize: true,
                fullscreen: true,
                fullscreenWeb: true,
                pip: true,
                setting: true,
                subtitleOffset: true,
                playbackRate: true,
                hotkey: true,
                lock: true,
                gesture: true,
                miniProgressBar: true,
                fastForward: true,
                autoMini: false,
                autoOrientation: true,
                airplay: true,
                controls: [
                    {
                        name: 'study-subtitle-toggle',
                        position: 'right',
                        html: '字幕',
                        tooltip: '隐藏学习字幕',
                        click() {
                            const next = !subtitleVisibleRef.current;
                            subtitleVisibleRef.current = next;
                            setSubtitleVisible(next);
                            art.notice.show = next ? '学习字幕已显示' : '学习字幕已隐藏';
                        },
                    },
                ],
                settings: [
                    {
                        name: 'study-subtitle-visibility',
                        html: '学习字幕',
                        tooltip: '显示中',
                        switch: true,
                        onSwitch(item) {
                            const next = !subtitleVisibleRef.current;
                            subtitleVisibleRef.current = next;
                            setSubtitleVisible(next);
                            item.tooltip = next ? '显示中' : '已隐藏';
                            art.notice.show = next ? '学习字幕已显示' : '学习字幕已隐藏';
                        },
                    },
                    {
                        name: 'study-subtitle-size',
                        html: '字幕大小',
                        tooltip: '标准',
                        selector: SUBTITLE_SCALE_OPTIONS.map((option) => ({
                            html: option.label,
                            value: option.value,
                            default: option.value === subtitleScaleRef.current,
                        })),
                        onSelect(item) {
                            const nextScale = Number(item.value ?? 1);
                            subtitleScaleRef.current = nextScale;
                            setSubtitleScale(nextScale);
                            item.tooltip = item.html;
                            art.notice.show = `字幕大小：${item.html}`;
                        },
                    },
                ],
                moreVideoAttr: {
                    playsInline: true,
                    preload: 'auto',
                },
            });
            artRef.current = art;
            art.volume = snapshotRef.current.volume;
            const emitSnapshot = (patch) => {
                const video = art.video;
                const absoluteMs = Math.round(video.currentTime * 1000);
                const elapsedMs = Math.min(durationMs, Math.max(0, absoluteMs - clipStartMs));
                const next = {
                    ...createSnapshot(elapsedMs, absoluteMs, durationMs, snapshotRef.current.isReady || video.readyState >= 2, !video.paused && !video.ended, snapshotRef.current.isBuffering, snapshotRef.current.isAutoplayBlocked, video.volume, segments, knowledgePoints),
                    ...patch,
                };
                snapshotRef.current = next;
                setSnapshot(next);
                onStateChangeRef.current?.(next);
                return next;
            };
            const tryPlay = (fromBeginning = false) => {
                const video = art.video;
                const startSec = clipStartMs / 1000;
                const endSec = effectiveClipEndMs / 1000;
                const outsideSlice = video.currentTime < startSec || video.currentTime > endSec;
                if (fromBeginning || outsideSlice) {
                    art.currentTime = startSec;
                    finishedRef.current = false;
                    emitSnapshot({ elapsedMs: 0, absoluteMs: clipStartMs });
                }
                const attempt = art.play();
                if (attempt && typeof attempt.then === 'function') {
                    void attempt
                        .then(() => {
                        emitSnapshot({ isAutoplayBlocked: false, isBuffering: false });
                    })
                        .catch(() => {
                        emitSnapshot({ isAutoplayBlocked: true, isPlaying: false, isBuffering: false });
                    });
                }
            };
            const handleLoadedMetadata = () => {
                const startSec = clipStartMs / 1000;
                if (Math.abs(art.currentTime - startSec) > 0.1) {
                    art.currentTime = startSec;
                }
                emitSnapshot({
                    elapsedMs: 0,
                    absoluteMs: clipStartMs,
                    isReady: true,
                    isBuffering: false,
                });
                onReadyRef.current?.();
                if (autoplay) {
                    window.requestAnimationFrame(() => {
                        tryPlay();
                    });
                }
            };
            const handleTimeUpdate = () => {
                const absoluteMs = Math.round(art.currentTime * 1000);
                if (absoluteMs >= effectiveClipEndMs) {
                    art.pause();
                    const finalState = emitSnapshot({
                        elapsedMs: durationMs,
                        absoluteMs: effectiveClipEndMs,
                        isPlaying: false,
                        isBuffering: false,
                    });
                    if (!finishedRef.current) {
                        finishedRef.current = true;
                        onStateChangeRef.current?.(finalState);
                        onFinishRef.current?.();
                    }
                    return;
                }
                emitSnapshot();
            };
            const handleSeeked = () => {
                const absoluteMs = Math.round(art.currentTime * 1000);
                if (absoluteMs < clipStartMs) {
                    art.currentTime = clipStartMs / 1000;
                    return;
                }
                if (absoluteMs > effectiveClipEndMs) {
                    art.currentTime = effectiveClipEndMs / 1000;
                }
                emitSnapshot({ isBuffering: false });
            };
            const video = art.video;
            const loadStart = () => emitSnapshot({ isReady: false, isBuffering: true });
            const canPlay = () => emitSnapshot({ isReady: true, isBuffering: false });
            const playing = () => emitSnapshot({
                isReady: true,
                isPlaying: true,
                isBuffering: false,
                isAutoplayBlocked: false,
            });
            const paused = () => emitSnapshot({ isPlaying: false });
            const waiting = () => emitSnapshot({ isBuffering: true });
            const seeking = () => emitSnapshot({ isBuffering: true });
            const volumeChange = () => emitSnapshot({ volume: video.volume });
            const error = () => {
                emitSnapshot({ isBuffering: false, isPlaying: false });
                const message = '当前视频浏览器无法正常解码播放。请优先使用 MP4(H.264/AAC) 或 WebM 格式。';
                setPlayerError(message);
                onErrorRef.current?.(message);
            };
            video.addEventListener('loadstart', loadStart);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('canplay', canPlay);
            video.addEventListener('playing', playing);
            video.addEventListener('pause', paused);
            video.addEventListener('waiting', waiting);
            video.addEventListener('seeking', seeking);
            video.addEventListener('seeked', handleSeeked);
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('volumechange', volumeChange);
            video.addEventListener('error', error);
            cleanupListeners = () => {
                video.removeEventListener('loadstart', loadStart);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('canplay', canPlay);
                video.removeEventListener('playing', playing);
                video.removeEventListener('pause', paused);
                video.removeEventListener('waiting', waiting);
                video.removeEventListener('seeking', seeking);
                video.removeEventListener('seeked', handleSeeked);
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('volumechange', volumeChange);
                video.removeEventListener('error', error);
            };
        })
            .catch((error) => {
            console.error(error);
            const message = '播放器内核初始化失败，请稍后重试。';
            setPlayerError(message);
            onErrorRef.current?.(message);
        });
        return () => {
            disposed = true;
            cleanupListeners?.();
            artRef.current?.destroy(false);
            artRef.current = null;
        };
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
    ]);
    useImperativeHandle(ref, () => ({
        play() {
            artRef.current?.play();
        },
        pause() {
            artRef.current?.pause();
        },
        toggle() {
            const art = artRef.current;
            if (!art) {
                return;
            }
            if (art.video.paused) {
                art.play();
                return;
            }
            art.pause();
        },
        restart() {
            const art = artRef.current;
            if (!art) {
                return;
            }
            finishedRef.current = false;
            art.currentTime = clipStartMs / 1000;
            void art.play();
        },
        seekTo(nextElapsedMs) {
            const art = artRef.current;
            if (!art) {
                return;
            }
            const clamped = Math.min(durationMs, Math.max(0, nextElapsedMs));
            art.currentTime = (clipStartMs + clamped) / 1000;
        },
        setVolume(nextVolume) {
            const art = artRef.current;
            if (!art) {
                return;
            }
            art.volume = Math.min(1, Math.max(0, nextVolume));
        },
        getState() {
            return snapshotRef.current;
        },
    }), [clipStartMs, durationMs]);
    const overlayText = snapshot.currentSegment
        ? showRomaji
            ? `${snapshot.currentSegment.kana} / ${snapshot.currentSegment.romaji}`
            : snapshot.currentSegment.kana
        : '';
    return (_jsxs("div", { className: className ? `asp-shell ${className}` : 'asp-shell', style: shellStyle, children: [_jsxs("div", { className: "asp-stage", children: [_jsx("div", { ref: hostRef }), subtitleVisible && snapshot.currentSegment ? (_jsxs("div", { className: "asp-subtitle-card", children: [_jsxs("span", { className: "asp-subtitle-label", children: [title || 'Study Clip', sourceLabel ? ` / ${sourceLabel}` : ''] }), _jsx("strong", { className: "asp-subtitle-ja", children: renderHighlightedText(snapshot.currentSegment.ja, snapshot.activePoints) }), _jsx("span", { className: "asp-subtitle-meta", children: overlayText }), _jsx("span", { className: "asp-subtitle-zh", children: snapshot.currentSegment.zh })] })) : null, playerError ? (_jsxs("div", { className: "asp-error-card", children: [_jsx("strong", { children: "\u89C6\u9891\u6682\u65F6\u65E0\u6CD5\u64AD\u653E" }), _jsx("span", { children: playerError })] })) : null, !playerError && !snapshot.isPlaying ? (_jsx("button", { type: "button", className: "asp-overlay-button", onClick: () => {
                            if (artRef.current?.video.paused) {
                                void artRef.current.play();
                            }
                        }, children: snapshot.isAutoplayBlocked ? '点击开始播放' : snapshot.elapsedMs > 0 ? '继续播放' : '开始播放' })) : null, !playerError && snapshot.isBuffering && snapshot.isReady ? (_jsx("div", { className: "asp-status", children: "\u6B63\u5728\u7F13\u51B2\u2026" })) : null, !playerError && !snapshot.isReady && !snapshot.isAutoplayBlocked ? (_jsx("div", { className: "asp-status", children: "\u89C6\u9891\u52A0\u8F7D\u4E2D\u2026" })) : null] }), _jsxs("div", { className: "asp-hud", children: [_jsx("span", { children: snapshot.isPlaying ? '正在播放' : '已暂停' }), _jsxs("strong", { children: [formatClock(snapshot.elapsedMs), " / ", formatClock(durationMs)] })] })] }));
});
//# sourceMappingURL=AnimeStudyPlayer.js.map