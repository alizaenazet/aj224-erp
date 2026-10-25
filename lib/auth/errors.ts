import type { AuthError } from "@supabase/supabase-js";

/** Indonesian message for Supabase Auth errors shown on the auth pages. */
export function authErrorMessage(error: AuthError | null | undefined) {
  switch (error?.code) {
    case "invalid_credentials":
      return "Email atau kata sandi salah.";
    case "user_banned":
      return "Akun Anda dinonaktifkan. Hubungi Super Admin.";
    case "weak_password":
      return "Kata sandi terlalu lemah. Gunakan minimal 8 karakter.";
    case "same_password":
      return "Kata sandi baru harus berbeda dari kata sandi lama.";
    case "session_not_found":
    case "session_expired":
      return "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";
    default:
      if (error?.name === "AuthSessionMissingError") {
        return "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.";
      }
      return "Terjadi kesalahan. Periksa koneksi lalu coba lagi.";
  }
}
