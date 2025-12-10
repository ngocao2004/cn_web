import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import User from '../models/User.js';
import Token from '../models/token.js';
import { geocodeLocation } from '../helper/geocodeLocation.js';
// HÀM HỖ TRỢ CHUẨN HÓA GIỚI TÍNH VÀO TỪNG GIÁ TRỊ CỤ THỂ
const normalizeGender = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (['male', 'nam'].includes(normalized)) {
        return 'Male';
    }
    if (['female', 'nữ', 'nu'].includes(normalized)) {
        return 'Female';
    }
    if (['other', 'khác', 'khac'].includes(normalized)) {
        return 'Other';
    }

    return null;
};
// HÀM HỖ TRỢ CHUẨN HÓA GIỚI TÍNH TRONG PREFERENCES
const normalizeLookingFor = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (['male', 'nam'].includes(normalized)) {
        return 'Male';
    }
    if (['female', 'nữ', 'nu'].includes(normalized)) {
        return 'Female';
    }
    if (['all', 'tat ca', 'tất cả', 'all genders'].includes(normalized)) {
        return 'All';
    }

    return null;
};
// HÀM XÂY DỰNG ĐỐI TƯỢNG USER TRẢ VỀ CHO CLIENT (LOẠI BỎ THÔNG TIN NHẠY CẢM)
const buildUserResponse = (userDoc) => {
    if (!userDoc) {
        return null;
    }

    const plainUser = userDoc.toObject({ virtuals: true });
    const { password, __v, _id, location, hometown, gender, geoLocation, ...rest } = plainUser;
    const id = _id?.toString();
    const normalizedHometown = typeof hometown === 'string' && hometown.trim().length > 0
        ? hometown.trim()
        : (typeof location === 'string' && location.trim().length > 0 ? location.trim() : 'Not updated');
    const normalizedGeoLocation = geoLocation
        && typeof geoLocation === 'object'
        && Array.isArray(geoLocation.coordinates)
        && geoLocation.coordinates.length === 2
        ? {
            type: 'Point',
            coordinates: [
                Number(geoLocation.coordinates[0]) || 0,
                Number(geoLocation.coordinates[1]) || 0,
            ],
        }
        : undefined;
    const normalizedGender = normalizeGender(gender) || 'Other';
    const normalizedHobbies = Array.isArray(rest.hobbies) ? rest.hobbies : [];
    const normalizedStudySubjects = Array.isArray(rest.studySubjects) ? rest.studySubjects : [];
    const normalizedPhotoGallery = Array.isArray(rest.photoGallery)
        ? rest.photoGallery
        : (typeof plainUser.avatar === 'string' && plainUser.avatar ? [plainUser.avatar] : []);

    return {
        ...rest,
        hobbies: normalizedHobbies,
        studySubjects: normalizedStudySubjects,
        photoGallery: normalizedPhotoGallery,
        _id: id,
        id,
        gender: normalizedGender,
        hometown: normalizedHometown,
        location: normalizedHometown,
        geoLocation: normalizedGeoLocation,
        isProfileComplete: typeof userDoc.isProfileComplete === 'function'
            ? userDoc.isProfileComplete()
            : rest.profileCompleted ?? false,
    };
};

// HASH MẬT KHẨU
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
// SO SÁNH MẬT KHẨU
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
// TẠO ACCESS TOKEN (Thời gian tồn tại ngắn)
const generateAccessToken = (userId) => {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_ACCESS_EXPIRATION 
    });
};

// TẠO VÀ LƯU REFRESH TOKEN (Thời gian tồn tại dài)
const generateAndSaveRefreshToken = async (userId) => {
    const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION
    });

    const expiresAt = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRATION_MS)); // Ví dụ: 30 ngày
    
    const hashedToken = await hashPassword(refreshToken);

    await Token.create({
        userId,
        token: hashedToken,
        expires: expiresAt,
    });

    return refreshToken;
};

// LOGIC ĐĂNG KÝ
export const registerUser = async (userData) => {
    const { name, email, password, gender, ...rest } = userData;

    if(!email.endsWith('@sis.hust.edu.vn')) {
        const error = new Error('Bạn phải đăng ký với email của HUST.');
        error.statusCode = httpStatus.BAD_REQUEST;
        throw error;
    }

    if (await User.findOne({ email })) {
        const error = new Error('Email đã được sử dụng.');
        error.statusCode = httpStatus.CONFLICT;
        throw error;
    }

    const hashedPassword = await hashPassword(password);
    const normalizedGender = normalizeGender(gender) || 'Other';

    // 3. Tạo người dùng
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        gender: normalizedGender,
        ...rest  
    });

    const safeUser = buildUserResponse(newUser);
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = await generateAndSaveRefreshToken(newUser._id);

    return { user: safeUser, tokens: { accessToken, refreshToken } };
};

// LOGIC ĐĂNG NHẬP
export const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password'); // Lấy cả password

    if (!user || !(await comparePassword(password, user.password))) {
        const error = new Error('Email hoặc mật khẩu không chính xác.');
        error.statusCode = httpStatus.UNAUTHORIZED;
        throw error;
    }

    const safeUser = buildUserResponse(user);
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateAndSaveRefreshToken(user._id);
    
    return { user: safeUser, tokens: { accessToken, refreshToken } };
};

export const getUserProfile = async (userId) => {
    if (!userId) {
        const error = new Error('Thiếu userId.');
        error.statusCode = httpStatus.BAD_REQUEST;
        throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('Người dùng không tồn tại.');
        error.statusCode = httpStatus.NOT_FOUND;
        throw error;
    }

    return buildUserResponse(user);
};
// LOGIC CẬP NHẬT PROFILE NGƯỜI DÙNG
export const updateUserProfile = async (userId, payload) => {
    if (!userId) {
        const error = new Error('Thiếu userId.');
        error.statusCode = httpStatus.BAD_REQUEST;
        throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('Người dùng không tồn tại.');
        error.statusCode = httpStatus.NOT_FOUND;
        throw error;
    }

    const {
        gender,
        dob,
        career,
        location,
        bio,
        hobbies,
        zodiac,
        preferences,
        classYear,
        studySubjects,
        academicHighlights,
        connectionGoal,
    } = payload;

    if (gender) {
        const normalizedGender = normalizeGender(gender);
        if (!normalizedGender) {
            const error = new Error('Giới tính không hợp lệ.');
            error.statusCode = httpStatus.BAD_REQUEST;
            throw error;
        }
        user.gender = normalizedGender;
    }

    if (dob) {
        const parsedDob = new Date(dob);
        if (Number.isNaN(parsedDob.getTime())) {
            const error = new Error('Ngày sinh không hợp lệ.');
            error.statusCode = httpStatus.BAD_REQUEST;
            throw error;
        }
        user.dob = parsedDob;
    }

    if (career !== undefined) {
        if (typeof career === 'string') {
            const trimmedCareer = career.trim();
            user.career = trimmedCareer.length > 0 ? trimmedCareer : 'Not updated';
        } else {
            user.career = 'Not updated';
        }
    }

    if (classYear !== undefined) {
        if (typeof classYear === 'string') {
            const trimmedClassYear = classYear.trim();
            user.classYear = trimmedClassYear.length > 0 ? trimmedClassYear : 'Not updated';
        } else {
            user.classYear = 'Not updated';
        }
    }

    let trimmedLocation;
    if (location !== undefined) {
        if (typeof location === 'string') {
            trimmedLocation = location.trim();
            if (trimmedLocation.length > 0) {
                user.hometown = trimmedLocation;
                user.location = trimmedLocation;
            } else {
                user.hometown = 'Not updated';
                user.location = 'Not updated';
            }
        } else {
            user.hometown = 'Not updated';
            user.location = 'Not updated';
        }
    }

    if (bio !== undefined) {
        const trimmedBio = typeof bio === 'string' ? bio.trim().slice(0, 500) : '';
        user.bio = trimmedBio;
    }

    if (Array.isArray(hobbies)) {
        const sanitizedHobbies = Array.from(
            new Set(
                hobbies
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter((item) => item.length > 0)
            )
        ).slice(0, 20);
        user.hobbies = sanitizedHobbies;
    }

    if (zodiac) {
        user.zodiac = zodiac;
    }

    if (Array.isArray(studySubjects)) {
        const sanitizedSubjects = Array.from(
            new Set(
                studySubjects
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter((item) => item.length > 0)
            )
        ).slice(0, 20);
        user.studySubjects = sanitizedSubjects;
    }

    if (typeof academicHighlights === 'string') {
        user.academicHighlights = academicHighlights.trim().slice(0, 400);
    }

    if (typeof connectionGoal === 'string') {
        const normalizedGoal = connectionGoal.trim();
        const allowedGoals = ['study', 'friendship', 'relationship'];
        user.connectionGoal = allowedGoals.includes(normalizedGoal) ? normalizedGoal : '';
    }

    if (trimmedLocation && trimmedLocation.length > 0) {
        try {
            const geocodeResult = await geocodeLocation(trimmedLocation);
            if (geocodeResult?.coordinates) {
                user.geoLocation = {
                    type: 'Point',
                    coordinates: geocodeResult.coordinates,
                };
            }
        } catch (geocodeError) {
            console.error('⚠️  Không thể geocode địa điểm:', geocodeError);
        }
    } else if (location !== undefined) {
        user.geoLocation = {
            type: 'Point',
            coordinates: [0, 0],
        };
    }

    const currentPrefs = user.preferences || {};
    const incomingPrefs = preferences || {};

    const normalizedLookingFor = normalizeLookingFor(
        incomingPrefs.lookingFor ?? currentPrefs.lookingFor ?? 'All'
    ) || 'All';

    const allowedGoals = ['study', 'friendship', 'relationship'];
    const normalizedPrefGoal = typeof incomingPrefs.connectionGoal === 'string'
        ? incomingPrefs.connectionGoal.trim()
        : currentPrefs.connectionGoal;
    const finalPrefGoal = allowedGoals.includes(normalizedPrefGoal)
        ? normalizedPrefGoal
        : (allowedGoals.includes(user.connectionGoal) ? user.connectionGoal : '');

    let normalizedPrefSubjects = currentPrefs.studySubjects || [];
    if (Array.isArray(incomingPrefs.studySubjects)) {
        normalizedPrefSubjects = Array.from(
            new Set(
                incomingPrefs.studySubjects
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter((item) => item.length > 0)
            )
        ).slice(0, 20);
    } else if (Array.isArray(user.studySubjects) && user.studySubjects.length > 0) {
        normalizedPrefSubjects = user.studySubjects;
    }

    const minAgeCandidate = Number(
        incomingPrefs.ageRange?.min ?? currentPrefs.ageRange?.min ?? 18
    );
    const maxAgeCandidate = Number(
        incomingPrefs.ageRange?.max ?? currentPrefs.ageRange?.max ?? 99
    );

    if (
        Number.isNaN(minAgeCandidate)
        || Number.isNaN(maxAgeCandidate)
        || minAgeCandidate < 18
        || maxAgeCandidate > 99
        || minAgeCandidate >= maxAgeCandidate
    ) {
        const error = new Error('Khoảng tuổi không hợp lệ.');
        error.statusCode = httpStatus.BAD_REQUEST;
        throw error;
    }

    const distanceCandidate = Number(
        incomingPrefs.distance ?? currentPrefs.distance ?? 50
    );

    if (Number.isNaN(distanceCandidate) || distanceCandidate <= 0) {
        const error = new Error('Khoảng cách không hợp lệ.');
        error.statusCode = httpStatus.BAD_REQUEST;
        throw error;
    }

    user.preferences = {
        lookingFor: normalizedLookingFor,
        ageRange: {
            min: minAgeCandidate,
            max: maxAgeCandidate,
        },
        distance: distanceCandidate,
        connectionGoal: finalPrefGoal,
        studySubjects: normalizedPrefSubjects,
    };

    user.profileCompleted = true;
    user.lastActive = new Date();
    user.updatedAt = new Date();

    await user.save();

    return buildUserResponse(user);
};
// LOGIC LÀM MỚI TOKEN
export const logoutUser = async (userId) => {
    await Token.deleteMany({ userId });
}

// LOGIC LÀM MỚI TOKEN
export const refreshAccessToken = async (refreshToken) => {
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Refresh Token không hợp lệ.');
    }

    const user = await User.findById(payload.sub);

    if (!user) {
        throw new Error('Không tìm thấy người dùng.');
    }

    const accessToken = generateAccessToken(user._id);

    return accessToken;
};