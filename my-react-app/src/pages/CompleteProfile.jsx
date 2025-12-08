import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Heart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Compass,
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Plus,
  X,
  Tag,
  Target,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

const steps = [
  {
    id: 'basics',
    title: 'Thông tin cơ bản',
    subtitle: 'Giúp mọi người cảm nhận bạn nhanh hơn',
    icon: Users,
  },
  {
    id: 'connections',
    title: 'Sở thích & Mục tiêu',
    subtitle: 'Chia sẻ điều bạn mong đợi từ HUSTLove',
    icon: Heart,
  },
  {
    id: 'academic',
    title: 'Thông tin học thuật',
    subtitle: 'Cho cộng đồng biết bạn đang học gì',
    icon: GraduationCap,
  },
];

const zodiacRanges = [
  { name: 'Bạch Dương', start: '03-21', end: '04-19' },
  { name: 'Kim Ngưu', start: '04-20', end: '05-20' },
  { name: 'Song Tử', start: '05-21', end: '06-20' },
  { name: 'Cự Giải', start: '06-21', end: '07-22' },
  { name: 'Sư Tử', start: '07-23', end: '08-22' },
  { name: 'Xử Nữ', start: '08-23', end: '09-22' },
  { name: 'Thiên Bình', start: '09-23', end: '10-22' },
  { name: 'Bọ Cạp', start: '10-23', end: '11-21' },
  { name: 'Nhân Mã', start: '11-22', end: '12-21' },
  { name: 'Ma Kết', start: '12-22', end: '01-19' },
  { name: 'Bảo Bình', start: '01-20', end: '02-18' },
  { name: 'Song Ngư', start: '02-19', end: '03-20' },
];

const facultyOptions = [
  'Cơ Khí',
  'Công Nghệ Thông Tin',
  'Điện - Điện tử',
  'Kinh Tế & Quản Lý',
  'Ngoại Ngữ',
  'Hóa Học',
  'Vật Lý Kỹ Thuật',
  'Kiến Trúc',
];

const classYearOptions = ['K65', 'K66', 'K67', 'K68', 'K69', 'Khác'];

const connectionGoalOptions = [
  {
    value: 'study',
    label: 'Học cùng',
    description: 'Tìm bạn đồng hành trên giảng đường',
    icon: BookOpen,
  },
  {
    value: 'friendship',
    label: 'Kết bạn',
    description: 'Mở rộng vòng tròn bạn bè Bách khoa',
    icon: Users,
  },
  {
    value: 'relationship',
    label: 'Hẹn hò',
    description: 'Kết nối cảm xúc, tìm một nửa phù hợp',
    icon: Heart,
  },
];

const defaultForm = {
  gender: '',
  dob: '',
  career: '',
  classYear: '',
  location: '',
  bio: '',
  hobbies: [],
  studySubjects: [],
  zodiac: '',
  connectionGoal: '',
  academicHighlights: '',
  preferences: {
    lookingFor: 'All',
    ageRange: { min: 20, max: 35 },
    distance: 30,
  },
};

const getAgeFromDob = (dob) => {
  if (!dob) {
    return '';
  }
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) {
    return '';
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const getZodiacFromDob = (dob) => {
  if (!dob) {
    return '';
  }
  const [year, month, day] = dob.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  const formatted = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  for (const zodiac of zodiacRanges) {
    if (zodiac.start <= zodiac.end) {
      if (formatted >= zodiac.start && formatted <= zodiac.end) {
        return zodiac.name;
      }
    } else {
      if (formatted >= zodiac.start || formatted <= zodiac.end) {
        return zodiac.name;
      }
    }
  }
  return '';
};

const formatDobForInput = (dobValue) => {
  if (!dobValue) {
    return '';
  }
  if (dobValue.includes('T')) {
    return dobValue.split('T')[0];
  }
  return dobValue;
};

const hydrateFormFromUser = (user) => ({
  gender: user.gender || '',
  dob: formatDobForInput(user.dob),
  career: user.faculty || user.career || user.job || '',
  classYear: user.classYear || user.khoaHoc || '',
  location: user.hometown || user.location || '',
  bio: user.bio || '',
  hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
  studySubjects: Array.isArray(user.studySubjects)
    ? user.studySubjects
    : Array.isArray(user.preferences?.studySubjects)
    ? user.preferences.studySubjects
    : [],
  zodiac: user.zodiac || '',
  connectionGoal:
    user.connectionGoal ||
    user.preferences?.connectionGoal ||
    user.lookingForGoal ||
    '',
  academicHighlights: user.academicHighlights || '',
  preferences: {
    lookingFor:
      user.preferences?.lookingFor || user.lookingFor || user.preferencesLookingFor || 'All',
    ageRange: {
      min: user.preferences?.ageRange?.min || user.preferenceAgeMin || 20,
      max: user.preferences?.ageRange?.max || user.preferenceAgeMax || 35,
    },
    distance: user.preferences?.distance || user.preferenceDistance || 30,
    studySubjects:
      Array.isArray(user.preferences?.studySubjects) && user.preferences.studySubjects.length > 0
        ? user.preferences.studySubjects
        : undefined,
    connectionGoal: user.preferences?.connectionGoal,
  },
});

export default function CompleteProfile() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [hobbyInput, setHobbyInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setFormData((prev) => ({ ...prev, ...hydrateFormFromUser(parsed) }));
      const initialPreview =
        parsed.avatar ||
        (Array.isArray(parsed.photoGallery) && parsed.photoGallery.length > 0
          ? parsed.photoGallery[0]
          : '');
      setPhotoPreview(initialPreview || '');
    } catch (error) {
      console.error('Failed to parse user session', error);
      navigate('/login');
    }
  }, [navigate]);

  const derivedAge = useMemo(() => getAgeFromDob(formData.dob), [formData.dob]);
  const derivedZodiac = useMemo(() => {
    if (formData.zodiac) {
      return formData.zodiac;
    }
    return getZodiacFromDob(formData.dob);
  }, [formData.dob, formData.zodiac]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updatePreference = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
    const key = `preferences.${field}`;
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const buildStepErrors = (index) => {
    const stepErrors = {};
    if (index === 0) {
      if (!formData.gender) {
        stepErrors.gender = 'Vui lòng chọn giới tính.';
      }
      if (!formData.dob) {
        stepErrors.dob = 'Vui lòng chọn ngày sinh.';
      }
      if (!formData.location) {
        stepErrors.location = 'Vui lòng nhập địa điểm sinh sống.';
      }
      if (!formData.bio || formData.bio.length < 30) {
        stepErrors.bio = 'Hãy viết ít nhất 30 ký tự để tạo ấn tượng đầu tiên.';
      }
    }
    if (index === 1) {
      if (!formData.connectionGoal) {
        stepErrors.connectionGoal = 'Vui lòng chọn mục tiêu kết nối.';
      }
      if (!formData.preferences.lookingFor) {
        stepErrors['preferences.lookingFor'] = 'Vui lòng chọn đối tượng mong muốn.';
      }
      const { ageRange } = formData.preferences;
      if (ageRange.min < 18) {
        stepErrors['preferences.ageRange'] = 'Độ tuổi tối thiểu phải từ 18 trở lên.';
      }
      if (ageRange.min >= ageRange.max) {
        stepErrors['preferences.ageRange'] = 'Tuổi tối đa phải lớn hơn tuổi tối thiểu.';
      }
      if (formData.preferences.distance < 1) {
        stepErrors['preferences.distance'] = 'Khoảng cách phải lớn hơn 0 km.';
      }
      if (formData.hobbies.length === 0) {
        stepErrors.hobbies = 'Thêm ít nhất một sở thích để mọi người dễ bắt chuyện.';
      }
    }
    if (index === 2) {
      if (!formData.career) {
        stepErrors.career = 'Vui lòng chọn khoa đang theo học.';
      }
      if (!formData.classYear) {
        stepErrors.classYear = 'Vui lòng chọn khóa học.';
      }
    }
    return stepErrors;
  };

  const handleNext = () => {
    const stepErrors = buildStepErrors(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    setServerMessage('');
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setServerMessage('');
  };

  const handleAddHobby = () => {
    const value = hobbyInput.trim();
    if (!value) {
      return;
    }
    setFormData((prev) => {
      if (prev.hobbies.includes(value)) {
        return prev;
      }
      return { ...prev, hobbies: [...prev.hobbies, value] };
    });
    setHobbyInput('');
    setErrors((prev) => {
      if (!prev.hobbies) {
        return prev;
      }
      const next = { ...prev };
      delete next.hobbies;
      return next;
    });
  };

  const handleRemoveHobby = (hobby) => {
    setFormData((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((item) => item !== hobby),
    }));
  };

  const handleAddSubject = () => {
    const value = subjectInput.trim();
    if (!value) {
      return;
    }
    setFormData((prev) => {
      if (prev.studySubjects.includes(value)) {
        return prev;
      }
      return { ...prev, studySubjects: [...prev.studySubjects, value] };
    });
    setSubjectInput('');
  };

  const handleRemoveSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      studySubjects: prev.studySubjects.filter((item) => item !== subject),
    }));
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPhotoPreview(objectUrl);
  };

  const handleSectionHeaderClick = (index) => {
    if (index < currentStep) {
      setCurrentStep(index);
      setServerMessage('');
      return;
    }

    if (index === currentStep) {
      return;
    }

    if (index === currentStep + 1) {
      const stepErrors = buildStepErrors(currentStep);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setErrors({});
      setCurrentStep(index);
      setServerMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validations = steps.map((_, index) => buildStepErrors(index));
    const flatErrors = validations.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {}
    );

    if (Object.keys(flatErrors).length > 0) {
      setErrors(flatErrors);
      const firstInvalidStep = validations.findIndex((item) => Object.keys(item).length > 0);
      if (firstInvalidStep >= 0) {
        setCurrentStep(firstInvalidStep);
      }
      return;
    }
    if (!user) {
      setServerMessage('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSubmitting(true);
    setServerMessage('');

    try {
      const payload = {
        userId: user.id || user._id,
        gender: formData.gender,
        age: typeof derivedAge === 'number' ? derivedAge : undefined,
        dob: formData.dob,
        career: formData.career,
        classYear: formData.classYear,
        location: formData.location,
        bio: formData.bio,
        hobbies: formData.hobbies,
        zodiac: derivedZodiac,
        studySubjects: formData.studySubjects,
        connectionGoal: formData.connectionGoal,
        academicHighlights: formData.academicHighlights,
        preferences: {
          lookingFor: formData.preferences.lookingFor,
          ageRange: formData.preferences.ageRange,
          distance: formData.preferences.distance,
          connectionGoal: formData.connectionGoal,
          studySubjects: formData.studySubjects,
        },
      };

      const response = await axios.put(`${API_URL}/api/auth/profile`, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      const nextUser = response.data?.user;
      if (!nextUser) {
        throw new Error('Server không trả về dữ liệu người dùng.');
      }

      const mergedUser = {
        ...user,
        ...nextUser,
        id: nextUser.id || nextUser._id,
        _id: nextUser._id || nextUser.id,
        dob: nextUser.dob,
        age: getAgeFromDob(nextUser.dob),
        career: nextUser.career || payload.career,
        faculty: nextUser.faculty || payload.career,
        classYear: nextUser.classYear || payload.classYear || user.classYear || '',
        academicHighlights: nextUser.academicHighlights || payload.academicHighlights || '',
        job: nextUser.career || nextUser.job,
        hometown: nextUser.hometown || nextUser.location,
        location: nextUser.hometown || nextUser.location,
        geoLocation: nextUser.geoLocation,
        zodiac: nextUser.zodiac,
        hobbies: Array.isArray(nextUser.hobbies) ? nextUser.hobbies : payload.hobbies,
        studySubjects: Array.isArray(nextUser.studySubjects)
          ? nextUser.studySubjects
          : payload.studySubjects,
        connectionGoal: nextUser.connectionGoal || payload.connectionGoal || '',
        preferences: {
          ...nextUser.preferences,
          lookingFor: nextUser.preferences?.lookingFor || payload.preferences.lookingFor,
          ageRange: nextUser.preferences?.ageRange || payload.preferences.ageRange,
          distance: nextUser.preferences?.distance || payload.preferences.distance,
          connectionGoal:
            nextUser.preferences?.connectionGoal || payload.preferences.connectionGoal,
          studySubjects:
            Array.isArray(nextUser.preferences?.studySubjects) &&
            nextUser.preferences.studySubjects.length > 0
              ? nextUser.preferences.studySubjects
              : payload.preferences.studySubjects,
        },
        lookingFor:
          nextUser.preferences?.lookingFor ||
          nextUser.lookingFor ||
          payload.preferences.lookingFor,
        isProfileComplete: nextUser.isProfileComplete ?? true,
      };

      sessionStorage.setItem('user', JSON.stringify(mergedUser));
      window.dispatchEvent(new Event('userChanged'));
      setServerMessage('Cập nhật hồ sơ thành công.');

      navigate('/feed');
    } catch (error) {
      console.error('Failed to update profile', error);
      const message = error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ.';
      setServerMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Đang tải thông tin hồ sơ...</span>
        </div>
      </div>
    );
  }

  const renderStepFields = (stepIndex) => {
    if (stepIndex === 0) {
      return (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Users className="h-4 w-4 text-rose-400" />
                Giới tính
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'Male', label: 'Nam' },
                  { value: 'Female', label: 'Nữ' },
                  { value: 'Other', label: 'Khác' },
                ].map((option) => {
                  const isActive = formData.gender === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => updateField('gender', option.value)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-rose-100 ${
                        isActive
                          ? 'border-rose-300 bg-rose-50 text-rose-500 shadow-sm shadow-rose-100'
                          : 'border-rose-100 bg-white/90 text-slate-500 hover:border-rose-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {errors.gender && <p className="text-sm text-rose-500">{errors.gender}</p>}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Calendar className="h-4 w-4 text-rose-400" />
                Ngày sinh
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(event) => updateField('dob', event.target.value)}
                  className="w-full rounded-2xl border border-rose-100 bg-white px-10 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-rose-500">
                {derivedAge ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1">
                    <Sparkles className="h-3 w-3" /> Tuổi {derivedAge}
                  </span>
                ) : null}
                {derivedZodiac ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-white px-3 py-1">
                    <Heart className="h-3 w-3" /> {derivedZodiac}
                  </span>
                ) : null}
              </div>
              {errors.dob && <p className="text-sm text-rose-500">{errors.dob}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <MapPin className="h-4 w-4 text-rose-400" />
              Nơi sinh sống
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
              <input
                type="text"
                value={formData.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Ví dụ: KTX Bách Khoa, Hai Bà Trưng"
                className="w-full rounded-2xl border border-rose-100 bg-white px-11 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
              />
            </div>
            {errors.location && <p className="text-sm text-rose-500">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-4 w-4 text-rose-400" />
              Giới thiệu bản thân
            </label>
            <textarea
              value={formData.bio}
              onChange={(event) => updateField('bio', event.target.value.slice(0, 500))}
              rows={4}
              placeholder="Chia sẻ tính cách, niềm đam mê hoặc câu chuyện khiến bạn nổi bật."
              className="w-full rounded-3xl border border-rose-100 bg-white px-6 py-4 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formData.bio.length}/500 ký tự</span>
              {errors.bio && <span className="text-rose-500">{errors.bio}</span>}
            </div>
          </div>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Target className="h-4 w-4 text-rose-400" />
              Mục tiêu kết nối
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              {connectionGoalOptions.map((option) => {
                const Icon = option.icon;
                const isActive = formData.connectionGoal === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => updateField('connectionGoal', option.value)}
                    className={`rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-rose-100 ${
                      isActive
                        ? 'border-rose-300 bg-rose-50 text-rose-500 shadow-sm shadow-rose-100'
                        : 'border-rose-100 bg-white/95 text-slate-600 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {isActive ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.connectionGoal && <p className="text-sm text-rose-500">{errors.connectionGoal}</p>}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-4 w-4 text-rose-400" />
              Sở thích nổi bật
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="group inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-500"
                >
                  {hobby}
                  <button
                    type="button"
                    onClick={() => handleRemoveHobby(hobby)}
                    className="rounded-full border border-transparent p-1 text-rose-400 transition group-hover:border-rose-200 group-hover:text-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <input
                  type="text"
                  value={hobbyInput}
                  onChange={(event) => setHobbyInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddHobby();
                    }
                  }}
                  placeholder="Thêm sở thích mới..."
                  className="w-full rounded-2xl border border-rose-100 bg-white px-11 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <button
                type="button"
                onClick={handleAddHobby}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200/70 transition hover:scale-[1.01]"
              >
                <Plus className="h-4 w-4" />
                Thêm sở thích
              </button>
            </div>
            {errors.hobbies && <p className="text-sm text-rose-500">{errors.hobbies}</p>}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <BookOpen className="h-4 w-4 text-rose-400" />
              Môn học muốn học cùng
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.studySubjects.map((subject) => (
                <span
                  key={subject}
                  className="group inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-600"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(subject)}
                    className="rounded-full border border-transparent p-1 text-teal-400 transition group-hover:border-teal-200 group-hover:text-teal-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300" />
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(event) => setSubjectInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddSubject();
                    }
                  }}
                  placeholder="Ví dụ: Giải tích, Lập trình C++"
                  className="w-full rounded-2xl border border-teal-100 bg-white px-11 py-3 text-sm text-slate-700 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSubject}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-6 py-3 text-sm font-semibold text-teal-500 shadow-sm transition hover:border-teal-300 hover:text-teal-600"
              >
                <Plus className="h-4 w-4" />
                Thêm môn học
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50/60 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-500">
              <Compass className="h-4 w-4" />
              Bộ lọc ghép đôi
            </div>
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Đối tượng ưu tiên
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'All', label: 'Tất cả' },
                  { value: 'Male', label: 'Nam' },
                  { value: 'Female', label: 'Nữ' },
                ].map((option) => {
                  const isActive = formData.preferences.lookingFor === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => updatePreference('lookingFor', option.value)}
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-rose-100 ${
                        isActive
                          ? 'border-rose-400 bg-white text-rose-500 shadow-sm'
                          : 'border-rose-100 bg-white/90 text-slate-500 hover:border-rose-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {errors['preferences.lookingFor'] && (
                <p className="text-sm text-rose-500">{errors['preferences.lookingFor']}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Độ tuổi từ
                </span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={formData.preferences.ageRange.min}
                  onChange={(event) =>
                    updatePreference('ageRange', {
                      ...formData.preferences.ageRange,
                      min: Number(event.target.value || 18),
                    })
                  }
                  className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Đến
                </span>
                <input
                  type="number"
                  min={formData.preferences.ageRange.min + 1}
                  max={99}
                  value={formData.preferences.ageRange.max}
                  onChange={(event) =>
                    updatePreference('ageRange', {
                      ...formData.preferences.ageRange,
                      max: Number(event.target.value || formData.preferences.ageRange.min + 1),
                    })
                  }
                  className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
                />
              </div>
            </div>
            {errors['preferences.ageRange'] && (
              <p className="text-sm text-rose-500">{errors['preferences.ageRange']}</p>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Khoảng cách tối đa
              </span>
              <input
                type="range"
                min="1"
                max="200"
                value={formData.preferences.distance}
                onChange={(event) => updatePreference('distance', Number(event.target.value))}
                className="w-full accent-rose-400"
              />
              <p className="text-sm font-medium text-rose-500">
                Tối đa {formData.preferences.distance} km
              </p>
              {errors['preferences.distance'] && (
                <p className="text-sm text-rose-500">{errors['preferences.distance']}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Briefcase className="h-4 w-4 text-rose-400" />
              Khoa
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
              <input
                list="faculty-options"
                value={formData.career}
                onChange={(event) => updateField('career', event.target.value)}
                placeholder="Ví dụ: Công Nghệ Thông Tin"
                className="w-full rounded-2xl border border-rose-100 bg-white px-11 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
              />
              <datalist id="faculty-options">
                {facultyOptions.map((faculty) => (
                  <option key={faculty} value={faculty} />
                ))}
              </datalist>
            </div>
            {errors.career && <p className="text-sm text-rose-500">{errors.career}</p>}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <GraduationCap className="h-4 w-4 text-rose-400" />
              Khóa học
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
              <input
                list="classyear-options"
                value={formData.classYear}
                onChange={(event) => updateField('classYear', event.target.value)}
                placeholder="Ví dụ: K68"
                className="w-full rounded-2xl border border-rose-100 bg-white px-11 py-3 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
              />
              <datalist id="classyear-options">
                {classYearOptions.map((year) => (
                  <option key={year} value={year} />
                ))}
              </datalist>
            </div>
            {errors.classYear && <p className="text-sm text-rose-500">{errors.classYear}</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-white/85 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-500">
            <BookOpen className="h-4 w-4" />
            Môn học bạn đã chọn
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.studySubjects.length > 0 ? (
              formData.studySubjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-600"
                >
                  {subject}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">
                Bạn chưa chọn môn học nào. Thêm ở mục "Sở thích & Mục tiêu" để tìm bạn học phù hợp.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-4 w-4 text-rose-400" />
            Thành tựu học thuật (tùy chọn)
          </label>
          <textarea
            value={formData.academicHighlights || ''}
            onChange={(event) => updateField('academicHighlights', event.target.value.slice(0, 400))}
            rows={3}
            placeholder="Chia sẻ học bổng, dự án nghiên cứu hoặc CLB học thuật bạn tham gia."
            className="w-full rounded-3xl border border-rose-100 bg-white px-6 py-4 text-sm text-slate-700 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
          />
        </div>
      </div>
    );
  };

  const completionPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-100 py-24">
      <div className="pointer-events-none absolute -left-16 top-32 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-pink-200/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6 rounded-[32px] border border-rose-100 bg-white/75 p-8 shadow-xl shadow-rose-100/60 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-100 p-3 text-rose-500">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">Xin chào</p>
                <h2 className="text-xl font-semibold text-slate-800">{user.name}</h2>
              </div>
            </div>

            <div className="rounded-[24px] border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-500">
              <p className="font-semibold">Hồ sơ đầy đủ = ấn tượng tốt</p>
              <p className="mt-1 text-xs text-rose-400">
                Những hồ sơ hoàn thiện thường nhận được nhiều lượt ghép đôi hơn 3 lần so với trung bình.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <button
                    type="button"
                    key={step.id}
                    onClick={() => handleSectionHeaderClick(index)}
                    className={`group flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-rose-300 bg-rose-50 text-rose-500 shadow-sm shadow-rose-100'
                        : isCompleted
                        ? 'border-teal-200 bg-teal-50 text-teal-600'
                        : 'border-rose-100 bg-white/90 text-slate-500 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-teal-500 text-white' : 'bg-rose-100 text-rose-500'
                      }`}>
                        {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition ${isActive ? 'rotate-180 text-rose-400' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-rose-100 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">
                <span>Tiến độ</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-rose-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-teal-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Bước {currentStep + 1}/{steps.length} • {steps[currentStep].title}
              </p>
            </div>
          </aside>

          <main className="relative overflow-hidden rounded-[36px] border border-rose-100 bg-white/90 p-8 shadow-2xl shadow-rose-100/70 md:p-10">
            <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-pink-100/60 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute bottom-0 left-10 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl" aria-hidden />

            <header className="relative space-y-6 border-b border-rose-100/80 pb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">
                <Sparkles className="h-3 w-3" /> Hoàn thiện hồ sơ
              </span>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl space-y-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                    Hồ sơ của {user.name}
                  </h1>
                  <p className="text-base text-slate-600">
                    Bổ sung vài chi tiết nữa để HUSTLove tìm đúng người đồng điệu với bạn.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-rose-200/80 bg-rose-50 shadow-inner">
                      {photoPreview ? (
                        <img src={photoPreview} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-rose-300">
                          <Heart className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-400 to-pink-400 p-2 text-white shadow-lg shadow-rose-200/70"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                  <div className="max-w-xs text-xs text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">Ảnh đại diện</p>
                    <p>Ảnh rõ nét, tươi sáng sẽ khiến hồ sơ của bạn thu hút hơn. Bạn có thể cập nhật sau khi lưu.</p>
                  </div>
                </div>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="relative mt-8 space-y-8">
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isOpen = index === currentStep;
                  const isCompleted = index < currentStep;
                  return (
                    <div
                      key={step.id}
                      className={`rounded-[28px] border border-rose-100 bg-white/85 shadow-sm shadow-rose-100/50 transition ${
                        isOpen ? 'ring-2 ring-rose-200' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSectionHeaderClick(index)}
                        className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                            isCompleted
                              ? 'bg-teal-500 text-white'
                              : isOpen
                              ? 'bg-rose-100 text-rose-500'
                              : 'bg-rose-50 text-rose-400'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                          </span>
                          <div>
                            <p className="text-base font-semibold text-slate-700">{step.title}</p>
                            <p className="text-xs text-slate-500">{step.subtitle}</p>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-rose-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="space-y-6 border-t border-rose-100/70 px-6 py-6">
                          {renderStepFields(index)}

                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-slate-500">
                              {index < steps.length - 1
                                ? `Tiếp theo: ${steps[index + 1].title}`
                                : 'Khi lưu lại, hồ sơ của bạn sẽ được bật sáng trong cộng đồng.'}
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={index === 0 || isSubmitting}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                              </button>
                              {index < steps.length - 1 && (
                                <button
                                  type="button"
                                  onClick={handleNext}
                                  disabled={isSubmitting}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200/70 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Tiếp tục
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {serverMessage && (
                <div
                  className={`rounded-3xl border px-5 py-4 text-sm font-semibold ${
                    serverMessage.includes('thành công')
                      ? 'border-teal-200 bg-teal-50 text-teal-600'
                      : 'border-rose-200 bg-rose-50 text-rose-500'
                  }`}
                >
                  {serverMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-teal-300 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-rose-200/60 transition hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang lưu hồ sơ...
                  </>
                ) : (
                  <>
                    Lưu hồ sơ
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}