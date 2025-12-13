import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Heart, RotateCcw, X as XIcon, MessageCircle } from 'lucide-react';
import OtherProfileCard from '../components/OtherProfileCard';

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Cannot parse user from session storage', error);
      return {};
    }
  }, []);

  const userId = storedUser?.id || storedUser?._id;
  const [matchQueue, setMatchQueue] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [isLoadingDeck, setIsLoadingDeck] = useState(Boolean(API_URL && userId));
  const [deckError, setDeckError] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});

  // State cho editing metrics trong sidebar
  const [editingMetrics, setEditingMetrics] = useState({
    distance: 3,
    ageMin: 20,
    ageMax: 25
  });
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [isEditingAge, setIsEditingAge] = useState(false);

  const activeProfile = matchQueue[activeIndex];
  
  const finderDistance = useMemo(() => {
    if (appliedFilters.distance) {
      return `${appliedFilters.distance} km`;
    }
    return storedUser?.preferences?.distance || storedUser?.preferredDistance || 'Trong 3km';
  }, [appliedFilters.distance, storedUser?.preferences?.distance, storedUser?.preferredDistance]);

  const finderAgeRange = useMemo(() => {
    if (appliedFilters.ageRange?.min || appliedFilters.ageRange?.max) {
      const min = appliedFilters.ageRange.min || 18;
      const max = appliedFilters.ageRange.max || 50;
      return `${min} - ${max} tuổi`;
    }
    const preferred = storedUser?.preferredAgeRange;
    const agePreference = storedUser?.preferences?.ageRange;
    if (preferred) return preferred;
    if (agePreference && (Number.isFinite(agePreference.min) || Number.isFinite(agePreference.max))) {
      const min = Number.isFinite(agePreference.min) ? agePreference.min : '?';
      const max = Number.isFinite(agePreference.max) ? agePreference.max : '?';
      return `${min} - ${max} tuổi`;
    }
    return '20 - 25 tuổi';
  }, [appliedFilters.ageRange, storedUser?.preferredAgeRange, storedUser?.preferences?.ageRange]);

  const fetchDeck = useCallback(async (filters = {}) => {
    if (!API_URL || !userId) return;

    setIsLoadingDeck(true);
    setDeckError('');
    setActionError('');

    try {
      const params = new URLSearchParams();
      if (filters.distance) params.append('distance', filters.distance);
      if (filters.ageRange?.min) params.append('ageMin', filters.ageRange.min);
      if (filters.ageRange?.max) params.append('ageMax', filters.ageRange.max);

      const url = `${API_URL}/api/findlove/${userId}/deck${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || 'Không thể tải dữ liệu tìm kiếm.';
        throw new Error(message);
      }

      const payload = await response.json();
      const deck = Array.isArray(payload?.data) ? payload.data : [];

      setMatchQueue(deck);
      setActiveIndex(0);
      setHistory([]);
    } catch (error) {
      console.error('Fetch swipe deck failed:', error);
      setDeckError(error.message || 'Không thể tải dữ liệu tìm kiếm.');
    } finally {
      setIsLoadingDeck(false);
    }
  }, [API_URL, userId]);

  useEffect(() => {
    fetchDeck(appliedFilters);
  }, [fetchDeck]);

  useEffect(() => {
    if (API_URL) {
      return;
    }
    setDeckError('Thiếu cấu hình API. Vui lòng kiểm tra VITE_API_URL.');
    setIsLoadingDeck(false);
  }, [API_URL]);

  useEffect(() => {
    if (!API_URL || userId) {
      return;
    }
    setDeckError('Không tìm thấy thông tin người dùng. Hãy đăng nhập lại để tiếp tục.');
    setIsLoadingDeck(false);
  }, [API_URL, userId]);

  const submitSwipe = async (targetId, action) => {
    if (!API_URL || !userId) return;

    const response = await fetch(`${API_URL}/api/findlove/${userId}/swipe`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetId, action }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.message || 'Không thể lưu hành động swiping.';
      throw new Error(message);
    }
  };

  const handleNext = async (action) => {
    if (!activeProfile || isProcessingAction) return;

    setActionError('');

    try {
      setIsProcessingAction(true);
      await submitSwipe(activeProfile.id, action);
      setHistory((prev) => [{ profile: activeProfile, action }, ...prev.slice(0, 4)]);

      if (activeIndex + 1 >= matchQueue.length) {
        setActiveIndex(matchQueue.length);
        return;
      }

      setActiveIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Submit swipe failed:', error);
      setActionError(error.message || 'Không thể lưu hành động swiping.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRewind = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    const previousIndex = matchQueue.findIndex((profile) => profile.id === last.profile.id);
    if (previousIndex >= 0) {
      setActiveIndex(previousIndex);
      setHistory(rest);
      setActionError('');
    }
  };

  // Handler cho apply metrics từ sidebar
  const handleApplyMetrics = useCallback(() => {
    const filters = {
      distance: editingMetrics.distance,
      ageRange: {
        min: editingMetrics.ageMin,
        max: editingMetrics.ageMax
      }
    };
    setAppliedFilters(filters);
    setIsEditingDistance(false);
    setIsEditingAge(false);
    fetchDeck(filters);
  }, [editingMetrics, fetchDeck]);

  // Handler mở chat với opening move
  const handleOpeningMove = useCallback(async (message) => {
    if (!activeProfile) return;

    try {
      await axios.post(
        `${API_URL}/api/matches/opening-move`,
        {
          userId: storedUser._id || storedUser.id,
          targetUserId: activeProfile._id || activeProfile.id,
          message
        },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      alert('Đã gửi tin nhắn mở đầu! 💌');
    } catch (error) {
      console.error('Lỗi khi gửi opening move:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  }, [activeProfile, API_URL, storedUser]);

  const statusMessage = useMemo(() => {
    if (!API_URL) {
      return 'Thiếu cấu hình API. Vui lòng kiểm tra VITE_API_URL.';
    }
    if (!userId) {
      return 'Không tìm thấy thông tin người dùng. Hãy đăng nhập lại để tiếp tục.';
    }
    if (isLoadingDeck) {
      return 'Đang tải danh sách tương hợp cho bạn...';
    }
    if (deckError) {
      return deckError;
    }
    if (actionError) {
      return actionError;
    }
    if (!activeProfile) {
      return '🎉 Hết profile rồi! Quay lại sau để gặp thêm người mới nhé ~';
    }
    switch (history[0]?.action) {
      case 'like':
        return 'Bạn đã gửi một trái tim. Hãy xem điều kỳ diệu có xảy ra không nhé!';
      case 'nope':
        return 'Không sao cả, người dành cho bạn đang ở rất gần thôi.';
      default:
        return `${Math.max(0, matchQueue.length - activeIndex - 1)} profile đang đợi bạn khám phá.`;
    }
  }, [API_URL, actionError, activeProfile, activeIndex, deckError, history, isLoadingDeck, matchQueue.length, userId]);

  return (
    <div className="min-h-screen bg-[#fff5f8]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 pt-24 pb-16">
        <div className="flex w-full max-w-md flex-col items-center text-center text-sm text-rose-500/80">
          <span className="font-medium uppercase tracking-[0.35em]">find love</span>
          <p className="mt-2 text-[15px] text-rose-600/90">
            Chào {storedUser?.name?.split(' ')[0] || 'bạn'}, những nhịp tim mới đang chờ bạn ngay hôm nay 💕
          </p>
        </div>

        <div className="mt-12 flex w-full flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-stretch lg:justify-between">
            <aside className="hidden w-full max-w-[280px] flex-col gap-6 rounded-[28px] border border-rose-100/70 bg-white/80 p-6 text-sm text-rose-500 shadow-[0_18px_40px_-30px_rgba(188,144,255,0.6)] lg:flex">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400/80">Search metrics</h3>
                <div className="mt-5 space-y-4">
                  {/* Khoảng cách - Inline editing */}
                  <div className="rounded-[20px] border border-rose-100 bg-white px-4 py-3 text-xs">
                    {isEditingDistance ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-rose-500/90">Khoảng cách: {editingMetrics.distance} km</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={editingMetrics.distance}
                          onChange={(e) => setEditingMetrics(prev => ({ ...prev, distance: Number(e.target.value) }))}
                          className="w-full accent-rose-500"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingDistance(true)}
                        className="flex w-full items-center justify-between text-slate-600 hover:text-rose-500"
                      >
                        <span className="font-semibold text-rose-500/90">Khoảng cách</span>
                        <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-500">{finderDistance}</span>
                      </button>
                    )}
                  </div>

                  {/* Độ tuổi - Inline editing */}
                  <div className="rounded-[20px] border border-rose-100 bg-white px-4 py-3 text-xs">
                    {isEditingAge ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-rose-500/90 mb-1">Tuổi min: {editingMetrics.ageMin}</label>
                          <input
                            type="range"
                            min="18"
                            max="50"
                            value={editingMetrics.ageMin}
                            onChange={(e) => setEditingMetrics(prev => ({ ...prev, ageMin: Number(e.target.value) }))}
                            className="w-full accent-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-rose-500/90 mb-1">Tuổi max: {editingMetrics.ageMax}</label>
                          <input
                            type="range"
                            min="18"
                            max="50"
                            value={editingMetrics.ageMax}
                            onChange={(e) => setEditingMetrics(prev => ({ ...prev, ageMax: Number(e.target.value) }))}
                            className="w-full accent-rose-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingAge(true)}
                        className="flex w-full items-center justify-between text-slate-600 hover:text-rose-500"
                      >
                        <span className="font-semibold text-rose-500/90">Độ tuổi</span>
                        <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-500">{finderAgeRange}</span>
                      </button>
                    )}
                  </div>

                  {/* Nút áp dụng bộ lọc */}
                  {(isEditingDistance || isEditingAge) && (
                    <button
                      onClick={handleApplyMetrics}
                      className="w-full rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                    >
                      Áp dụng bộ lọc
                    </button>
                  )}
                </div>
              </div>
            </aside>

            <div className="flex w-full max-w-md flex-col items-center gap-10">
              <div className="relative w-full">
                {isLoadingDeck ? (
                  <div className="flex h-[82vh] flex-col items-center justify-center gap-4 rounded-[36px] border border-rose-100 bg-white/90 p-10 text-center shadow-[0_30px_80px_-60px_rgba(233,114,181,0.65)]">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-rose-200 border-t-rose-400" aria-hidden="true" />
                    <p className="text-sm font-medium text-rose-500/90">Đang tìm những nhịp tim phù hợp cho bạn...</p>
                  </div>
                ) : deckError && !activeProfile ? (
                  <div className="flex h-[82vh] flex-col items-center justify-center gap-4 rounded-[36px] border border-rose-100 bg-white/90 p-10 text-center shadow-[0_30px_80px_-60px_rgba(233,114,181,0.65)]">
                    <div className="rounded-full bg-white/60 p-6 text-rose-400 shadow-inner">
                      <Heart className="h-12 w-12" />
                    </div>
                    <div className="max-w-md text-rose-500">
                      <h3 className="text-2xl font-semibold">Không thể tải profile ✨</h3>
                      <p className="mt-3 text-sm leading-relaxed text-rose-400">{deckError}</p>
                    </div>
                  </div>
                ) : activeProfile ? (
                  <OtherProfileCard profile={activeProfile} />
                ) : (
                  <div className="flex h-[82vh] flex-col items-center justify-center gap-5 rounded-[36px] border border-rose-100 bg-white/90 p-10 text-center shadow-[0_30px_80px_-60px_rgba(233,114,181,0.65)]">
                    <div className="rounded-full bg-white/60 p-6 text-rose-400 shadow-inner">
                      <Heart className="h-12 w-12" />
                    </div>
                    <div className="max-w-md text-rose-500">
                      <h3 className="text-2xl font-semibold">Bạn đã khám phá tất cả hôm nay rồi ✨</h3>
                      <p className="mt-3 text-sm leading-relaxed text-rose-400">
                        Hãy quay lại vào lúc khác để gặp thêm những tâm hồn đẹp nhé!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => handleNext('nope')}
                    disabled={!activeProfile || isProcessingAction || isLoadingDeck}
                    className="group flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-300 shadow-[0_12px_30px_-18px_rgba(244,114,182,0.6)] transition hover:scale-105 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Không phải gu của bạn"
                  >
                    <XIcon className="h-8 w-8 transition group-hover:scale-110" />
                  </button>
                  <button
                    onClick={() => handleOpeningMove('Chào bạn! Mình thấy profile của bạn rất thú vị 😊')}
                    disabled={!activeProfile || isProcessingAction || isLoadingDeck}
                    className="group flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.6)] transition hover:scale-105 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Gửi tin nhắn mở đầu"
                  >
                    <MessageCircle className="h-6 w-6 transition group-hover:scale-110" />
                  </button>
                  <button
                    onClick={handleRewind}
                    disabled={history.length === 0}
                    className="group flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-amber-400 shadow-[0_10px_30px_-18px_rgba(251,191,36,0.5)] transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Quay lại profile trước"
                  >
                    <RotateCcw className="h-6 w-6 transition group-hover:rotate-[-12deg]" />
                  </button>
                  <button
                    onClick={() => handleNext('like')}
                    disabled={!activeProfile || isProcessingAction || isLoadingDeck}
                    className="group flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f7b0d2] via-[#f59fb6] to-[#fdd2b7] text-white shadow-[0_25px_65px_-30px_rgba(244,114,182,0.75)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Gửi trái tim"
                  >
                    <Heart className="h-9 w-9 fill-current transition group-hover:scale-110" />
                  </button>
                </div>

                <p className="text-center text-sm font-medium text-rose-500/90">{statusMessage}</p>

                {history.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-rose-400/90">
                    {history.map(({ profile, action }) => (
                      <span
                        key={`${profile.id}-${action}`}
                        className="rounded-full bg-white/60 px-3 py-1 backdrop-blur-sm"
                      >
                        {profile.name} · {action === 'like' ? 'đã nhận trái tim' : 'đã lướt qua'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden w-full max-w-[280px] flex-col gap-6 rounded-[28px] border border-rose-100/70 bg-white/80 p-6 text-sm text-rose-500 shadow-[0_18px_40px_-30px_rgba(188,144,255,0.6)] lg:flex">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400/80">HUST community</h3>
                <div className="mt-4 rounded-[24px] border border-rose-100 bg-white p-4">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Upcoming events</span>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Robotics Workshop</p>
                  <p className="text-xs text-slate-500">TQB Library · 08/12 · 18:00</p>
                  <button className="mt-4 w-full rounded-full bg-rose-500/90 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-500">
                    Thêm vào lịch
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-rose-100 bg-white p-5">
                <h4 className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">BK Crush</h4>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  Khám phá ai đang bí mật crush bạn và gửi lời nhắn dễ thương chỉ trong 1 chạm.
                </p>
                <button className="mt-4 w-full rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-100">
                  Mở BK Crush
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
