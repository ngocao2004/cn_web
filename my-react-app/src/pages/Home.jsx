import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Heart,
  MapPin,
  RotateCcw,
  Sparkles,
  X as XIcon,
} from 'lucide-react';

const SAMPLE_PROFILES = [
  {
    id: '1',
    name: 'Linh Nguyễn',
    age: 21,
    major: 'Thiết kế Đồ họa',
    classYear: 'K65',
    distance: '750m',
    location: 'Ký túc xá A',
    bio: 'Tin vào những điều ngọt ngào, cà phê latte và những chiều mưa Hà Nội. Thích vẽ ký họa và đang học làm bánh macaron.',
    interests: ['Vẽ minh họa', 'Acoustic', 'Trà hoa', 'Đi dạo hồ Tây'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1558600874-0ef3d7c8e59f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: '2',
    name: 'Minh Phương',
    age: 22,
    major: 'Truyền thông',
    classYear: 'K64',
    distance: '1.1km',
    location: 'Phố Chùa Láng',
    bio: 'Trưởng nhóm CLB nhiếp ảnh, luôn săn tìm những khoảnh khắc lấp lánh. Thích nói chuyện đêm khuya và đọc Haruki Murakami.',
    interests: ['Chụp ảnh film', 'Du lịch', 'Podcast', 'Yoga nhẹ nhàng'],
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: '3',
    name: 'Bảo Anh',
    age: 20,
    major: 'Công nghệ Thông tin',
    classYear: 'K66',
    distance: '500m',
    location: 'Giảng đường B',
    bio: 'Coder thích nghe nhạc city pop và pha cold brew. Đang xây một app học nhóm cho khoa và mong tìm người đồng hành.',
    interests: ['Chạy bộ', 'City pop', 'Startup idea', 'Cafe tour'],
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80',
    ],
  },
];

export default function Home() {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Cannot parse user from session storage', error);
      return {};
    }
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [matchQueue] = useState(SAMPLE_PROFILES);
  const [photoIndex, setPhotoIndex] = useState(0);

  const activeProfile = matchQueue[activeIndex];
  const photos = useMemo(() => {
    if (!activeProfile) {
      return [];
    }
    if (Array.isArray(activeProfile.images) && activeProfile.images.length > 0) {
      return activeProfile.images;
    }
    return activeProfile.image ? [activeProfile.image] : [];
  }, [activeProfile]);
  const finderName = storedUser?.name || 'Trần Văn Đức Anh';
  const finderInitial = finderName?.charAt(0) || 'H';
  const finderClass = storedUser?.classYear || 'K65';
  const finderDistance = storedUser?.preferredDistance || 'Trong 3km';
  const finderAgeRange = storedUser?.preferredAgeRange || '20 - 25 tuổi';

  // ✅ Tạo hiệu ứng số liệu động: dựa trên số thật nhưng thêm random theo thời gian
  useEffect(() => {
    setPhotoIndex(0);
  }, [activeIndex]);

  const handleNext = (action) => {
    if (!activeProfile) return;

    setHistory((prev) => [{ profile: activeProfile, action }, ...prev.slice(0, 4)]);

    if (activeIndex + 1 >= matchQueue.length) {
      setActiveIndex(matchQueue.length);
      return;
    }

    setActiveIndex((prev) => prev + 1);
  };

  const handleRewind = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    const previousIndex = matchQueue.findIndex((profile) => profile.id === last.profile.id);
    if (previousIndex >= 0) {
      setActiveIndex(previousIndex);
      setHistory(rest);
    }
  };

  const handleNextPhoto = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const statusText = () => {
    if (!activeProfile) {
      return '🎉 Hết profile rồi! Quay lại sau để gặp thêm người mới nhé ~';
    }
    switch (history[0]?.action) {
      case 'like':
        return 'Bạn đã gửi một trái tim. Hãy xem điều kỳ diệu có xảy ra không nhé!';
      case 'nope':
        return 'Không sao cả, người dành cho bạn đang ở rất gần thôi.';
      default:
        return `${matchQueue.length - activeIndex - 1} profile đang đợi bạn khám phá.`;
    }
  };

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
            <aside className="hidden w-full max-w-[280px] flex-col gap-6 rounded-[36px] border border-white/40 bg-white/25 p-6 text-sm text-rose-500 shadow-[0_28px_90px_-60px_rgba(188,144,255,0.6)] backdrop-blur-xl lg:flex">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400/80">Search metrics</h3>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-[24px] border border-white/50 bg-white/45 px-4 py-3 text-xs text-slate-600">
                    <span className="font-semibold text-rose-500/90">Khoảng cách</span>
                    <span className="rounded-full bg-white/70 px-3 py-1 font-medium text-teal-500">{finderDistance}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[24px] border border-white/50 bg-white/45 px-4 py-3 text-xs text-slate-600">
                    <span className="font-semibold text-rose-500/90">Độ tuổi</span>
                    <span className="rounded-full bg-white/70 px-3 py-1 font-medium text-teal-500">{finderAgeRange}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex w-full max-w-md flex-col items-center gap-10">
              <div className="relative w-full">
                <div className="absolute -inset-2 rounded-[48px] bg-gradient-to-br from-rose-200/60 via-[#ffd6c7] to-transparent opacity-70 blur-3xl" />

                <div className="relative mx-auto overflow-hidden rounded-[48px] border border-white/50 bg-white/30 shadow-[0_55px_150px_-65px_rgba(233,114,181,0.95)] backdrop-blur-2xl">
                  {activeProfile ? (
                    <article className="relative h-full min-h-[82vh] max-h-[88vh] w-full aspect-[9/16]">
                      {photos.length > 0 && (
                        <img
                          src={photos[photoIndex]}
                          alt={activeProfile.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-950/75 via-rose-900/35 to-transparent" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.32),_transparent_60%)]" />

                      {photos.length > 1 && (
                        <div className="absolute top-6 left-1/2 flex -translate-x-1/2 gap-2">
                          {photos.map((_, index) => (
                            <span
                              key={`${activeProfile.id}-indicator-${index}`}
                              className={`h-[3px] w-10 rounded-full transition ${
                                index === photoIndex ? 'bg-white/90' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevPhoto}
                            aria-label="Xem ảnh trước"
                            className="absolute inset-y-0 left-0 w-1/3 rounded-l-[48px] bg-gradient-to-r from-black/10 to-transparent text-white opacity-0 transition hover:opacity-100"
                          />
                          <button
                            onClick={handleNextPhoto}
                            aria-label="Xem ảnh tiếp theo"
                            className="absolute inset-y-0 right-0 w-1/3 rounded-r-[48px] bg-gradient-to-l from-black/10 to-transparent text-white opacity-0 transition hover:opacity-100"
                          />
                        </>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
                        <div className="flex flex-wrap items-end gap-3 text-4xl font-semibold tracking-tight md:text-5xl">
                          <h2>{activeProfile.name}</h2>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-lg font-medium">{activeProfile.age}</span>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-teal-100">
                          <span className="flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-teal-100">
                            <GraduationCap className="h-4 w-4 text-teal-100" />
                            {activeProfile.major} · {activeProfile.classYear}
                          </span>
                          <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-rose-50/90">
                            <MapPin className="h-4 w-4" />
                            {activeProfile.location} · {activeProfile.distance}
                          </span>
                        </div>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-rose-50/95">{activeProfile.bio}</p>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {activeProfile.interests.map((interest) => (
                            <span
                              key={interest}
                              className="flex items-center gap-2 rounded-xl border border-teal-200/70 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/90"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="flex h-[82vh] flex-col items-center justify-center gap-5 text-center">
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
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => handleNext('nope')}
                    disabled={!activeProfile}
                    className="group flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-300 shadow-[0_20px_45px_-20px_rgba(244,114,182,0.75)] transition hover:scale-105 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Không phải gu của bạn"
                  >
                    <XIcon className="h-8 w-8 transition group-hover:scale-110" />
                  </button>
                  <button
                    onClick={handleRewind}
                    disabled={history.length === 0}
                    className="group flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-amber-400 shadow-[0_20px_45px_-25px_rgba(251,191,36,0.7)] transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Quay lại profile trước"
                  >
                    <RotateCcw className="h-6 w-6 transition group-hover:rotate-[-12deg]" />
                  </button>
                  <button
                    onClick={() => handleNext('like')}
                    disabled={!activeProfile}
                    className="group flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f7b0d2] via-[#f59fb6] to-[#fdd2b7] text-white shadow-[0_35px_75px_-28px_rgba(244,114,182,0.85)] transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Gửi trái tim"
                  >
                    <Heart className="h-9 w-9 fill-current transition group-hover:scale-110" />
                  </button>
                </div>

                <p className="text-center text-sm font-medium text-rose-500/90">{statusText()}</p>

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

            <aside className="hidden w-full max-w-[280px] flex-col gap-6 rounded-[36px] border border-white/40 bg-white/25 p-6 text-sm text-rose-500 shadow-[0_28px_90px_-60px_rgba(188,144,255,0.6)] backdrop-blur-xl lg:flex">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-400/80">HUST community</h3>
                <div className="mt-4 rounded-[28px] border border-white/45 bg-white/40 p-4">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Upcoming events</span>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Robotics Workshop</p>
                  <p className="text-xs text-slate-500">TQB Library · 08/12 · 18:00</p>
                  <button className="mt-4 w-full rounded-full bg-rose-500/90 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-500">
                    Thêm vào lịch
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/45 bg-white/35 p-5">
                <h4 className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">BK Crush</h4>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  Khám phá ai đang bí mật crush bạn và gửi lời nhắn dễ thương chỉ trong 1 chạm.
                </p>
                <button className="mt-4 w-full rounded-full border border-teal-300/70 bg-teal-100/40 px-4 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-100">
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
