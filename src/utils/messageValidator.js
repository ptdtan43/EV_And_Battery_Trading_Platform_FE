/**
 * Message Validator - Chặn tin nhắn có thể dẫn đến giao dịch bên ngoài hệ thống
 */

// Từ khóa mạng xã hội cần chặn
const SOCIAL_MEDIA_KEYWORDS = [
    'zalo', 'zal', 'zl', 'za lo', 'za-lo',
    'facebook', 'fb', 'face', 'face book',
    'instagram', 'ig', 'insta', 'insta gram', 'ins', // ✅ Thêm 'ins' để chặn
    'telegram', 'tg', 'tele gram',
    'viber', 'whatsapp', 'wa', 'whats app',
    'messenger', 'msg', 'mes sen ger',
    'line', 'wechat', 'weibo', 'we chat',
    'skype', 'discord', 'snapchat', 'snap chat',
    'tiktok', 'twitter', 'x.com', 'tik tok',
    'linkedin', 'pinterest', 'youtube', 'you tube'
];

// ✅ Whitelist các từ thông thường không nên bị chặn
const ALLOWED_WORDS = [
    'alo', 'hello', 'hi', 'xin chào', 'chào', 'chao',
    'ok', 'okay', 'oke', 'oki', 'okie',
    'vâng', 'vang', 'dạ', 'da',
    'cảm ơn', 'cam on', 'thanks', 'thank you',
    'không sao', 'khong sao', 'không có gì', 'khong co gi',
    'được', 'duoc', 'đc', 'dc',
    'ừ', 'u', 'ừm', 'um', 'uhm',
    'bye', 'tạm biệt', 'tam biet'
];

// Các từ số bằng chữ Việt Nam
const NUMBER_WORDS = {
    'không': '0', 'ko': '0', 'k': '0',
    'một': '1', 'mốt': '1', 'mo': '1',
    'hai': '2', 'hi': '2', 'h': '2',
    'ba': '3', 'b': '3',
    'bốn': '4', 'tư': '4', 'bon': '4',
    'năm': '5', 'nam': '5', 'n': '5',
    'sáu': '6', 'sau': '6', 's': '6',
    'bảy': '7', 'bay': '7', 'b': '7',
    'tám': '8', 'tam': '8', 't': '8',
    'chín': '9', 'chin': '9', 'c': '9'
};

/**
 * Chuẩn hóa text: lowercase, bỏ dấu, bỏ khoảng trắng
 */
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
        .replace(/\s+/g, '') // Bỏ khoảng trắng
        .replace(/[.,\-_()]/g, ''); // Bỏ ký tự đặc biệt
};

/**
 * Phát hiện số điện thoại viết bằng chữ (VD: "không chín 82 ba sáu năm 73 hai bốn")
 */
const detectPhoneNumberInWords = (text) => {
    // Chuẩn hóa text: lowercase, bỏ dấu nhưng giữ khoảng trắng để phân tích từ
    const normalized = text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
        .replace(/[.,\-_()]/g, ' '); // Thay ký tự đặc biệt bằng khoảng trắng

    const words = normalized.split(/\s+/).filter(w => w.length > 0);

    // Chuyển đổi từ thành số
    let digits = [];
    let hasNumbers = false;
    let hasWords = false;

    for (const word of words) {
        // Nếu là số trực tiếp
        if (/^\d+$/.test(word)) {
            digits.push(...word.split(''));
            hasNumbers = true;
        }
        // Nếu là từ số
        else if (NUMBER_WORDS[word]) {
            digits.push(NUMBER_WORDS[word]);
            hasWords = true;
        }
        // Nếu không phải số hoặc từ số, reset counter nếu đã có đủ số
        else {
            // Nếu đã có 10-11 số (số điện thoại hợp lệ), trả về true
            if (digits.length >= 10 && digits.length <= 11) {
                return true;
            }
            // Reset nếu gặp từ không phải số
            if (digits.length < 7) {
                digits = [];
                hasNumbers = false;
                hasWords = false;
            }
        }
    }

    // Kiểm tra phần cuối cùng
    if (digits.length >= 10 && digits.length <= 11) {
        return true;
    }

    // Kiểm tra pattern hỗn hợp số và chữ (VD: "không chín 82 ba sáu năm 73 hai bốn")
    // Tìm chuỗi có ít nhất 7 số (số hoặc từ số) xen kẽ với nhau
    if (hasNumbers && hasWords && digits.length >= 7) {
        return true;
    }

    // Kiểm tra pattern có số điện thoại ẩn trong text
    // VD: "lien he 0823657342" hoặc "call me không chín tám hai ba sáu năm bảy ba bốn hai"
    const digitSequence = digits.join('');
    if (digitSequence.length >= 10 && digitSequence.length <= 11) {
        // Kiểm tra format số điện thoại VN (bắt đầu bằng 0 hoặc 84)
        if (digitSequence.startsWith('0') || digitSequence.startsWith('84')) {
            return true;
        }
    }

    // Pattern khác: số và chữ xen kẽ nhưng tổng >= 10 ký tự số
    // VD: "không chín 82 ba sáu năm 73 hai bốn"
    const allDigits = normalized.replace(/\D/g, '');
    const allWordsConverted = words.map(w => NUMBER_WORDS[w] || '').join('');
    const combined = allDigits + allWordsConverted;

    if (combined.length >= 10 && combined.length <= 11) {
        if (combined.startsWith('0') || combined.startsWith('84')) {
            return true;
        }
    }

    return false;
};

/**
 * Phát hiện số điện thoại dạng số
 */
const detectPhoneNumber = (text) => {
    if (!text) return false;

    // 1) Các chuỗi bắt đầu bằng 0, 84 hoặc +84 với NGĂN CÁCH tự do, tổng 8-12 chữ số
    const candidateMatches = text.match(/(\+?84|0)(?:[\s\-\.\(\)]*\d){7,12}/g);
    if (candidateMatches) {
        for (const m of candidateMatches) {
            const digits = m.replace(/\D/g, '');
            // Cho phép: 0xxxxxxxx (>=8) hoặc 84/ +84 theo sau (>=8)
            if (digits.startsWith('0') || digits.startsWith('84')) {
                if (digits.length >= 8 && digits.length <= 12) {
                    return true;
                }
            }
            if (digits.startsWith('84') && digits.length >= 10 && digits.length <= 13) {
                return true;
            }
        }
    }

    // 2) Dạng số liền nhau 8-12 chữ số (chặn mạnh tay để tránh lọt như 032323131)
    const plainSequences = text.match(/(?<!\d)\d{8,12}(?!\d)/g);
    if (plainSequences) {
        for (const seq of plainSequences) {
            // Ưu tiên các đầu số Việt Nam phổ biến (02,03,05,07,08,09,84)
            if (/^(0[235789]|02|84)/.test(seq)) {
                return true;
            }
        }
    }

    // 3) Dạng nhóm có dấu cách/chấm/gạch, tổng số chữ số 8-12
    const groupedMatches = text.match(/\d{2,4}(?:[\s\-\.]\d{2,4}){2,4}/g);
    if (groupedMatches) {
        for (const g of groupedMatches) {
            const digits = g.replace(/\D/g, '');
            if (digits.length >= 8 && digits.length <= 12 && /^(0|84)/.test(digits)) {
                return true;
            }
        }
    }

    // 4) Dạng (0xxx) xxx xxx
    const parenMatches = text.match(/\(0\d{2,4}\)\s*\d{3,4}\s*\d{3,4}/g);
    if (parenMatches && parenMatches.length) return true;

    return false;
};

/**
 * Phát hiện link/URL
 */
const detectLinks = (text) => {
    // Pattern URL
    const urlPatterns = [
        /https?:\/\/[^\s]+/gi,
        /www\.[^\s]+/gi,
        /[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?/gi,
    ];

    for (const pattern of urlPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    // Kiểm tra các domain phổ biến
    const commonDomains = [
        'facebook.com', 'fb.com', 'fb.me',
        'zalo.me', 'zalo.vn',
        'instagram.com', 'ig.com',
        't.me', 'telegram.org',
        'viber.com', 'whatsapp.com',
        'messenger.com', 'line.me'
    ];

    const normalized = normalizeText(text);
    for (const domain of commonDomains) {
        if (normalized.includes(domain)) {
            return true;
        }
    }

    return false;
};

/**
 * Phát hiện từ khóa mạng xã hội
 */
const detectSocialMediaKeywords = (text) => {
    if (!text || typeof text !== 'string') return false;

    // Chuẩn hóa text: lowercase, bỏ dấu nhưng giữ khoảng trắng để kiểm tra từ
    const textLower = text.toLowerCase();
    const textNormalized = textLower
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Bỏ dấu nhưng giữ khoảng trắng

    // Tách thành các từ để kiểm tra
    const words = textNormalized.split(/\s+/).filter(w => w.length > 0);

    for (const keyword of SOCIAL_MEDIA_KEYWORDS) {
        // Loại bỏ khoảng trắng trong keyword để so sánh
        const keywordClean = keyword.replace(/\s+/g, '');

        // ✅ Kiểm tra 1: Từ đầy đủ trong text gốc với word boundary (ưu tiên nhất)
        const regexWordBoundary = new RegExp(`\\b${keyword.replace(/\s+/g, '')}\\b`, 'i');
        if (regexWordBoundary.test(text)) {
            console.log(`🚫 Detected keyword "${keyword}" in text: "${text}"`);
            return true;
        }

        // ✅ Kiểm tra 2: Từ trong danh sách words (đã tách)
        for (const word of words) {
            // Match chính xác (cho tất cả từ khóa)
            if (word === keywordClean) {
                console.log(`🚫 Detected keyword "${keyword}" in word: "${word}"`);
                return true;
            }
            
            // Với từ khóa ngắn (2-3 ký tự như "ins", "ig", "fb"), chỉ match chính xác
            // Với từ khóa dài hơn, có thể match nếu word chứa keyword
            if (keywordClean.length > 3) {
                // Từ khóa dài: có thể match nếu word chứa keyword hoặc ngược lại
                if (word.includes(keywordClean) || keywordClean.includes(word)) {
                    // Đảm bảo độ dài hợp lý
                    if (keywordClean.length >= 2 && word.length >= 2) {
                        console.log(`🚫 Detected keyword "${keyword}" in word: "${word}"`);
                        return true;
                    }
                }
            }
            // Từ khóa ngắn (<= 3 ký tự) chỉ match chính xác (đã kiểm tra ở trên)
        }
    }

    return false;
};

/**
 * Kiểm tra xem tin nhắn có phải là từ được phép không
 * ✅ FIX: Chỉ match chính xác hoặc match từ đơn với word boundary để tránh match "zalo" với "alo"
 */
const isAllowedWord = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    const normalized = text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
        .replace(/[.,\-_()]/g, ''); // Bỏ ký tự đặc biệt
    
    // Tách thành các từ để kiểm tra
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    
    // Kiểm tra nếu toàn bộ tin nhắn là một từ được phép (match chính xác)
    for (const allowed of ALLOWED_WORDS) {
        const allowedNormalized = allowed
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[.,\-_()]/g, '');
        
        // ✅ Match chính xác
        if (normalized === allowedNormalized) {
            return true;
        }
        
        // ✅ Match từ đơn với word boundary (tránh match "zalo" với "alo")
        // Chỉ match nếu từ được phép là một từ đơn trong tin nhắn
        if (words.length === 1 && words[0] === allowedNormalized) {
            return true;
        }
        
        // ✅ Match nếu tin nhắn ngắn và chứa từ được phép như một từ riêng biệt
        if (words.length <= 2 && words.includes(allowedNormalized)) {
            return true;
        }
    }
    
    return false;
};

/**
 * Validate tin nhắn và trả về kết quả
 * @param {string} message - Tin nhắn cần validate
 * @returns {object} { isValid: boolean, reason: string, warning: string }
 */
export const validateMessage = (message) => {
    if (!message || typeof message !== 'string') {
        return {
            isValid: true,
            reason: null,
            warning: null
        };
    }

    const trimmed = message.trim();
    if (!trimmed) {
        return {
            isValid: true,
            reason: null,
            warning: null
        };
    }

    // ✅ FIX: Kiểm tra từ khóa mạng xã hội TRƯỚC whitelist để chặn mọi tin nhắn có từ khóa mạng xã hội
    // Điều này đảm bảo "ok ins", "qua ins" đều bị chặn vì chứa "ins"
    if (detectSocialMediaKeywords(trimmed)) {
        return {
            isValid: false,
            reason: 'social_media',
            warning: '⚠️ Không được phép đề cập đến các nền tảng mạng xã hội khác. Vui lòng sử dụng tính năng chat của hệ thống để giao dịch an toàn.'
        };
    }

    // Kiểm tra link
    if (detectLinks(trimmed)) {
        return {
            isValid: false,
            reason: 'links',
            warning: '⚠️ Không được phép gửi link trong tin nhắn. Vui lòng sử dụng tính năng chat của hệ thống để trao đổi.'
        };
    }

    // Kiểm tra số điện thoại dạng số
    if (detectPhoneNumber(trimmed)) {
        return {
            isValid: false,
            reason: 'phone_number',
            warning: '⚠️ Không được phép gửi số điện thoại trong tin nhắn. Vui lòng sử dụng tính năng chat của hệ thống để liên hệ.'
        };
    }

    // Kiểm tra số điện thoại viết bằng chữ
    if (detectPhoneNumberInWords(trimmed)) {
        return {
            isValid: false,
            reason: 'phone_number_words',
            warning: '⚠️ Không được phép gửi thông tin liên hệ dưới dạng số viết bằng chữ. Vui lòng sử dụng tính năng chat của hệ thống.'
        };
    }

    // ✅ Kiểm tra whitelist SAU khi đã chắc chắn không có từ khóa mạng xã hội
    // Chỉ cho phép các từ thông thường nếu không chứa từ khóa mạng xã hội
    if (isAllowedWord(trimmed)) {
        return {
            isValid: true,
            reason: null,
            warning: null
        };
    }

    return {
        isValid: true,
        reason: null,
        warning: null
    };
};

/**
 * Kiểm tra và hiển thị cảnh báo nếu tin nhắn không hợp lệ
 * @param {string} message - Tin nhắn cần kiểm tra
 * @param {function} showToast - Function để hiển thị toast
 * @returns {boolean} - true nếu tin nhắn hợp lệ, false nếu không
 */
export const validateAndShowWarning = (message, showToast) => {
    const validation = validateMessage(message);

    if (!validation.isValid) {
        if (showToast) {
            showToast({
                title: '🚫 Tin nhắn bị chặn',
                description: validation.warning,
                type: 'error',
                duration: 5000
            });
        }
        return false;
    }

    return true;
};

