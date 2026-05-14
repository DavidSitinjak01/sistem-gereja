'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Maximize, Minimize,
  Type, Play, Pause, ListMusic, Music,
  Cross,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SlideSong {
  id: string;
  title: string;
  artist: string | null;
  category: string | null;
  chord: string | null;
  songNumber: string | null;
  lyrics: string | null;
  note?: string | null; // e.g. PEMBUKA, PERSEMBAHAN
}

interface SlidePresenterProps {
  songs: SlideSong[];
  initialSongIndex?: number;
  onClose: () => void;
}

// Parse lyrics into slides - split by blank lines (each paragraph = one slide)
function parseLyricsToSlides(lyrics: string | null): string[] {
  if (!lyrics || !lyrics.trim()) return ['—'];

  const lines = lyrics.split('\n');
  const slides: string[] = [];
  let currentSlide: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      // Blank line = slide break
      if (currentSlide.length > 0) {
        slides.push(currentSlide.join('\n'));
        currentSlide = [];
      }
    } else {
      currentSlide.push(trimmed);
    }
  }

  if (currentSlide.length > 0) {
    slides.push(currentSlide.join('\n'));
  }

  return slides.length > 0 ? slides : ['—'];
}

type FontSize = 'sm' | 'md' | 'lg' | 'xl';
const FONT_SIZES: Record<FontSize, { label: string; base: string; line: string }> = {
  sm: { label: 'Kecil', base: 'text-2xl sm:text-3xl md:text-4xl', line: 'leading-relaxed' },
  md: { label: 'Sedang', base: 'text-3xl sm:text-4xl md:text-5xl', line: 'leading-relaxed' },
  lg: { label: 'Besar', base: 'text-4xl sm:text-5xl md:text-6xl', line: 'leading-snug' },
  xl: { label: 'Sangat Besar', base: 'text-5xl sm:text-6xl md:text-7xl', line: 'leading-snug' },
};

const NOTE_LABELS: Record<string, string> = {
  PEMBUKA: 'Lagu Pembuka',
  PERSEMBAHAN: 'Lagu Persembahan',
  PENYEMBAHAN: 'Lagu Penyembahan',
  PENGUTUSAN: 'Lagu Pengutusan',
  PENUTUP: 'Lagu Penutup',
};

export default function SongSlidePresenter({ songs, initialSongIndex = 0, onClose }: SlidePresenterProps) {
  const [songIndex, setSongIndex] = useState(initialSongIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  const [autoPlay, setAutoPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSongList, setShowSongList] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-0');

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSong = songs[songIndex];
  const slides = parseLyricsToSlides(currentSong?.lyrics || null);
  const totalSlides = slides.length;
  const totalSongs = songs.length;

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setFadeClass('opacity-100'));
  }, []);

  // Auto-hide controls
  const startHideTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  const showAndResetControls = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

  // Navigation
  const goNextSlide = useCallback(() => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      if (slideIndex < totalSlides - 1) {
        setSlideIndex(slideIndex + 1);
      } else if (songIndex < totalSongs - 1) {
        // Next song
        setSongIndex(songIndex + 1);
        setSlideIndex(0);
      }
      setFadeClass('opacity-100');
    }, 150);
  }, [slideIndex, totalSlides, songIndex, totalSongs]);

  const goPrevSlide = useCallback(() => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      if (slideIndex > 0) {
        setSlideIndex(slideIndex - 1);
      } else if (songIndex > 0) {
        // Previous song, go to last slide
        const prevSong = songs[songIndex - 1];
        const prevSlides = parseLyricsToSlides(prevSong?.lyrics || null);
        setSongIndex(songIndex - 1);
        setSlideIndex(prevSlides.length - 1);
      }
      setFadeClass('opacity-100');
    }, 150);
  }, [slideIndex, songIndex, songs]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goNextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goPrevSlide();
          break;
        case 'Escape':
          e.preventDefault();
          if (showSettings || showSongList) {
            setShowSettings(false);
            setShowSongList(false);
          } else if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'a':
        case 'A':
          setAutoPlay(prev => !prev);
          break;
        case 'l':
        case 'L':
          setShowSongList(prev => !prev);
          break;
      }
      showAndResetControls();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNextSlide, goPrevSlide, onClose, isFullscreen, showSettings, showSongList, showAndResetControls, toggleFullscreen]);

  // Auto-play
  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    if (autoPlay) {
      autoPlayTimerRef.current = setTimeout(() => {
        if (slideIndex < totalSlides - 1) {
          goNextSlide();
        } else if (songIndex < totalSongs - 1) {
          setSongIndex(songIndex + 1);
          setSlideIndex(0);
        } else {
          setAutoPlay(false);
        }
      }, 8000); // 8 seconds per slide
    }
    return () => { if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current); };
  }, [autoPlay, slideIndex, songIndex, totalSlides, totalSongs, goNextSlide]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Touch/swipe support
  const touchStartRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNextSlide();
      else goPrevSlide();
    }
    showAndResetControls();
  };

  const goToSong = (idx: number) => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      setSongIndex(idx);
      setSlideIndex(0);
      setShowSongList(false);
      setFadeClass('opacity-100');
    }, 150);
  };

  const cycleFontSize = () => {
    const sizes: FontSize[] = ['sm', 'md', 'lg', 'xl'];
    const idx = sizes.indexOf(fontSize);
    setFontSize(sizes[(idx + 1) % sizes.length]);
  };

  const fs = FONT_SIZES[fontSize];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white select-none"
      onMouseMove={showAndResetControls}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // Click on the main area to advance slide
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        goNextSlide();
      }}
    >
      {/* Cross watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <Cross className="w-96 h-96" />
      </div>

      {/* Main Slide Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-12 md:px-20 lg:px-32">
        {/* Song header info */}
        <div className={cn(
          'absolute top-4 sm:top-8 left-0 right-0 text-center transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        )}>
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm">
            {currentSong?.songNumber && (
              <span className="text-amber-400 font-mono">No. {currentSong.songNumber}</span>
            )}
            {currentSong?.songNumber && currentSong?.chord && (
              <span className="text-white/30">•</span>
            )}
            {currentSong?.chord && (
              <span className="text-amber-400 font-mono">Key: {currentSong.chord}</span>
            )}
            {currentSong?.note && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-amber-300">{NOTE_LABELS[currentSong.note] || currentSong.note}</span>
              </>
            )}
          </div>
        </div>

        {/* Song title */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 className={cn(
            'font-bold text-amber-400 tracking-tight',
            fontSize === 'sm' ? 'text-2xl sm:text-3xl' :
            fontSize === 'md' ? 'text-3xl sm:text-4xl' :
            fontSize === 'lg' ? 'text-4xl sm:text-5xl md:text-6xl' :
            'text-5xl sm:text-6xl md:text-7xl',
          )}>
            {currentSong?.title || '—'}
          </h1>
          {currentSong?.artist && (
            <p className="text-white/40 text-sm sm:text-base mt-1">{currentSong.artist}</p>
          )}
        </div>

        {/* Lyrics slide */}
        <div className={cn(
          'max-w-5xl w-full text-center transition-opacity duration-300',
          fadeClass,
        )}>
          <p className={cn(fs.base, fs.line, 'font-medium text-white/95 whitespace-pre-wrap')}>
            {slides[slideIndex]}
          </p>
        </div>

        {/* Slide counter */}
        <div className={cn(
          'absolute bottom-4 sm:bottom-8 left-0 right-0 text-center transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        )}>
          <div className="inline-flex items-center gap-3">
            {/* Slide dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === slideIndex
                      ? 'w-2.5 h-2.5 bg-amber-400'
                      : 'w-1.5 h-1.5 bg-white/20',
                  )}
                />
              ))}
            </div>
            <span className="text-white/30 text-xs font-mono">
              {slideIndex + 1}/{totalSlides}
              {totalSongs > 1 && (
                <> &middot; Lagu {songIndex + 1}/{totalSongs}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div
        data-controls
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 pointer-events-auto">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Mode Presentasi</p>
                <p className="text-[10px] text-white/50">Klik / ←→ / Spasi untuk navigasi</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); setShowSongList(prev => !prev); }}
                title="Daftar Lagu (L)"
              >
                <ListMusic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); cycleFontSize(); }}
                title={`Ukuran Font: ${fs.label}`}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 hover:bg-white/10',
                  autoPlay ? 'text-amber-400 hover:text-amber-300' : 'text-white/70 hover:text-white',
                )}
                onClick={(e) => { e.stopPropagation(); setAutoPlay(prev => !prev); }}
                title={autoPlay ? 'Hentikan Auto-play (A)' : 'Auto-play (A)'}
              >
                {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                title={isFullscreen ? 'Keluar Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                title="Tutup (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side navigation arrows */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-12 w-12 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all',
              (slideIndex === 0 && songIndex === 0) && 'opacity-0 pointer-events-none',
            )}
            onClick={(e) => { e.stopPropagation(); goPrevSlide(); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-12 w-12 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all',
              (slideIndex === totalSlides - 1 && songIndex === totalSongs - 1) && 'opacity-0 pointer-events-none',
            )}
            onClick={(e) => { e.stopPropagation(); goNextSlide(); }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Song List Panel */}
      {showSongList && (
        <div
          data-controls
          className="absolute top-14 left-3 sm:left-4 z-10 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-72 max-h-[70vh] overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ListMusic className="h-4 w-4 text-amber-400" />
                Daftar Lagu
              </h3>
            </div>
            <div className="overflow-y-auto max-h-96 p-2 space-y-1">
              {songs.map((song, idx) => {
                const songSlides = parseLyricsToSlides(song.lyrics);
                return (
                  <button
                    key={song.id}
                    onClick={() => goToSong(idx)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                      idx === songIndex
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-white/70 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        idx === songIndex
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-white/50',
                      )}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-[10px] text-white/40 truncate">
                          {songSlides.length} slide{song.note ? ` • ${NOTE_LABELS[song.note] || song.note}` : ''}
                        </p>
                      </div>
                      {idx === songIndex && (
                        <div className="flex gap-0.5">
                          {songSlides.map((_, si) => (
                            <div
                              key={si}
                              className={cn(
                                'w-1 h-3 rounded-full',
                                si === slideIndex ? 'bg-amber-400' : 'bg-white/20',
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Font size indicator toast */}
      {showControls && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] text-white/50">
            Font: {fs.label} &middot; {autoPlay ? 'Auto ▶' : 'Manual'}
          </div>
        </div>
      )}

      {/* Auto-play progress bar */}
      {autoPlay && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{
              width: `${((slideIndex + 1) / totalSlides) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}

// Utility component: a simple button to trigger slide mode
export function SlideModeButton({
  songs,
  initialIndex = 0,
  className,
  children,
}: {
  songs: SlideSong[];
  initialIndex?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);

  if (active) {
    return <SongSlidePresenter songs={songs} initialSongIndex={initialIndex} onClose={() => setActive(false)} />;
  }

  return (
    <button className={className} onClick={() => setActive(true)}>
      {children}
    </button>
  );
}
