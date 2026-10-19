import { AxiosError } from 'axios';

/**
 * Parses any error into a friendly, readable Vietnamese message.
 * Logs the original error in the developer console for debugging.
 */
export function parseFriendlyError(error: any, fallbackMessage: string = 'Không thể thực hiện thao tác, vui lòng thử lại'): string {
  // Use console.debug instead of console.error for handled errors to prevent tripping automated error catchers
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Developer DEBUG] Handled error:', error);
  }

  if (!error) {
    return fallbackMessage;
  }

  // Handle network / connection errors
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    return 'Không thể kết nối máy chủ, vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Yêu cầu kết nối quá hạn, vui lòng thử lại.';
  }

  // Handle Axios response errors
  const resData = error.response?.data;
  const apiMessage = typeof resData === 'string'
    ? resData
    : (resData?.message || resData?.detail || resData?.title || resData?.error);
  const apiStatus = error.response?.status;

  if (apiMessage) {
    const msg = String(apiMessage);

    // Map common loan renewal & circulation errors
    if (msg.includes('Only active, non-overdue loans can be renewed')) {
      return 'Chỉ có thể gia hạn các cuốn sách đang mượn và còn trong hạn (chưa quá hạn).';
    }

    if (msg.includes('Renewal limit reached')) {
      return 'Bạn đã đạt giới hạn số lần gia hạn cho cuốn sách này (tối đa 1 lần).';
    }

    if (msg.includes('Chưa tích hợp thanh toán trực tuyến') || msg.includes('không tự đánh dấu đã thanh toán')) {
      return 'Vui lòng nộp phạt trực tiếp tại quầy thủ thư. Hệ thống thanh toán trực tuyến đang được nâng cấp.';
    }

    if (msg.includes('Loan not found for the current member')) {
      return 'Phiếu mượn này không thuộc quyền sở hữu của bạn.';
    }

    if (msg.includes('Member profile not found')) {
      return 'Không tìm thấy hồ sơ độc giả liên kết với tài khoản này.';
    }

    // Map common error keys/identifiers to user-friendly Vietnamese messages
    if (
      msg.includes('invalid_current') || 
      msg.includes('auth.password.invalid_current') ||
      msg === 'auth.password.invalid_current'
    ) {
      return 'Mật khẩu hiện tại không chính xác.';
    }

    if (
      msg.includes('invalid_credentials') || 
      msg.includes('auth.login.invalid_credentials') || 
      msg === 'auth.login.invalid_credentials' ||
      msg === 'auth.login.error'
    ) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }

    if (
      msg.includes('account_locked') || 
      msg.includes('auth.login.account_locked')
    ) {
      return 'Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá nhiều lần.';
    }

    if (msg.includes('Không tìm thấy phiếu mượn hoặc sách cần trả') || msg === 'Không tìm thấy phiếu mượn hoặc sách cần trả') {
      return 'Không tìm thấy phiếu mượn hoặc sách cần trả';
    }

    if (msg.includes('Không tìm thấy phiếu mượn đang hoạt động cho sách này') || msg === 'Không tìm thấy phiếu mượn đang hoạt động cho sách này') {
      return 'Không tìm thấy phiếu mượn đang hoạt động cho sách này';
    }

    if (msg.includes('không thuộc độc giả này') || msg === 'Phiếu mượn không thuộc độc giả này') {
      return 'Phiếu mượn không thuộc độc giả này';
    }

    if (msg.includes('Có nhiều phiếu mượn') || msg === 'Có nhiều phiếu mượn cho sách này, vui lòng nhập mã phiếu mượn hoặc nhập thêm mã độc giả') {
      return 'Có nhiều phiếu mượn cho sách này, vui lòng nhập mã phiếu mượn hoặc nhập thêm mã độc giả';
    }

    if (msg.includes('mượn trùng') || msg === 'Độc giả này đang mượn sách này, không thể mượn trùng') {
      return 'Độc giả này đang mượn sách này, không thể mượn trùng';
    }

    if (msg.includes('không thể gia hạn') || msg.includes('đã trả') || msg === 'Không thể gia hạn phiếu mượn đã trả') {
      return 'Không thể gia hạn phiếu mượn đã trả';
    }

    if (msg.includes('đã được trả trước đó') || msg === 'Phiếu mượn này đã được trả trước đó') {
      return 'Phiếu mượn này đã được trả trước đó';
    }

    if (msg === 'circulation.checkout.unavailable' || msg === 'book_unavailable' || msg === 'limit_reached' || msg.includes('bản khả dụng') || msg.includes('Không còn bản khả dụng')) {
      return 'Sách này hiện không còn bản khả dụng';
    }

    if (msg === 'member.not_found' || msg === 'member_not_found' || msg === 'Không tìm thấy độc giả' || msg.includes('độc giả')) {
      return 'Không tìm thấy độc giả';
    }

    if (msg === 'book.not_found' || msg === 'book_not_found' || msg === 'Không tìm thấy sách trong hệ thống' || msg.includes('sách trong hệ thống')) {
      return 'Không tìm thấy sách trong hệ thống';
    }

    if (msg === 'circulation.checkin.not_found' || msg === 'Không tìm thấy phiếu mượn' || msg.includes('Không tìm thấy phiếu mượn ')) {
      return 'Không tìm thấy phiếu mượn';
    }

    if (msg === 'circulation.hold.book_available') {
      return 'Sách này vẫn còn số lượng trong kho, bạn có thể Mượn sách trực tiếp.';
    }

    if (msg === 'circulation.hold.unavailable') {
      return 'Sách hiện chưa có sẵn để giao.';
    }

    if (msg === 'member.toast_duplicate' || msg === 'duplicate_isbn' || msg === 'member.create.duplicate_code') {
      return 'Dữ liệu đã tồn tại trong hệ thống (Mã thẻ/ISBN trùng lặp).';
    }

    // fallback standard messages
    if (!msg.startsWith('error.')) {
      return msg;
    }
  }

  if (apiStatus === 401) {
    return 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }

  if (apiStatus === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (apiStatus === 404 && !apiMessage) {
    return 'Không tìm thấy tài nguyên yêu cầu trên máy chủ.';
  }

  if (apiStatus === 503) {
    return 'Máy chủ đang trong quá trình khởi động hoặc bảo trì. Vui lòng thử lại sau giây lát.';
  }

  if (apiStatus === 502 || apiStatus === 504) {
    return 'Kết nối máy chủ bị gián đoạn hoặc quá hạn phản hồi. Vui lòng thử lại.';
  }

  if (apiStatus >= 500) {
    return 'Hệ thống đang bận hoặc gặp sự cố xử lý, vui lòng thử lại sau.';
  }

  if (apiMessage && apiMessage.startsWith('error.')) {
    // standard key based translation hints
    return apiMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}
