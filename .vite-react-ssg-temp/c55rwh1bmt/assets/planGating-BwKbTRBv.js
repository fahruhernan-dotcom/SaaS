const FALLBACK_TRANSACTION_QUOTA = 30;
const AI_PLAN_CONFIG = {
  starter: {
    chat_sessions_per_month: 10,
    features: {
      chat_assistant: true,
      drafting: true,
      analisis_performa: false,
      prediksi_hasil: false,
      ai_audit_logs: false
    }
  },
  pro: {
    chat_sessions_per_month: 500,
    features: {
      chat_assistant: true,
      drafting: true,
      analisis_performa: true,
      prediksi_hasil: false,
      ai_audit_logs: false
    }
  },
  business: {
    chat_sessions_per_month: Infinity,
    features: {
      chat_assistant: true,
      drafting: true,
      analisis_performa: true,
      prediksi_hasil: true,
      ai_audit_logs: true
    }
  }
};
const UPGRADE_MESSAGES = {
  analisis_performa: "Analisis performa tersedia di plan Pro. Pantau ADG dan FCR ternakmu secara otomatis.",
  prediksi_hasil: "Prediksi waktu jual optimal tersedia di plan Business. Maksimalkan keuntungan tiap siklus.",
  chat_exceeded: "Kuota AI bulan ini habis. Upgrade ke Pro untuk 500 sesi/bulan."
};
export {
  AI_PLAN_CONFIG as A,
  FALLBACK_TRANSACTION_QUOTA as F,
  UPGRADE_MESSAGES as U
};
