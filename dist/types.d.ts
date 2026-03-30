export interface StudyTranscriptSegment {
    startMs: number;
    endMs: number;
    ja: string;
    kana: string;
    romaji: string;
    zh: string;
    focusTermIds: string[];
}
export interface StudyKnowledgePoint {
    id: string;
    kind: 'word' | 'grammar' | 'phrase';
    expression: string;
    reading: string;
    meaningZh: string;
    partOfSpeech: string;
    explanationZh: string;
    exampleJa: string;
    exampleZh: string;
}
export interface StudyPlayerSnapshot {
    elapsedMs: number;
    absoluteMs: number;
    durationMs: number;
    isReady: boolean;
    isPlaying: boolean;
    isBuffering: boolean;
    isAutoplayBlocked: boolean;
    volume: number;
    currentSegment?: StudyTranscriptSegment;
    activePoints: StudyKnowledgePoint[];
}
export interface AnimeStudyPlayerProps {
    url: string;
    poster?: string;
    title?: string;
    sourceLabel?: string;
    durationMs: number;
    clipStartMs?: number;
    clipEndMs?: number;
    segments: StudyTranscriptSegment[];
    knowledgePoints: StudyKnowledgePoint[];
    showRomaji?: boolean;
    autoplay?: boolean;
    themeColor?: string;
    className?: string;
    onFinish?: () => void;
    onError?: (message?: string) => void;
    onReady?: () => void;
    onStateChange?: (snapshot: StudyPlayerSnapshot) => void;
}
export interface AnimeStudyPlayerHandle {
    play: () => void;
    pause: () => void;
    toggle: () => void;
    restart: () => void;
    seekTo: (elapsedMs: number) => void;
    setVolume: (nextVolume: number) => void;
    getState: () => StudyPlayerSnapshot;
}
