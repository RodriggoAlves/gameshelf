"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "../login/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await requestPasswordReset(email);
    if (res.error) {
      setError(res.error);
    } else {
      setMessage(t.auth.emailSent);
      setEmail("");
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>{t.auth.forgotPasswordTitle}</h1>
        <p className={styles.subtitle}>{t.auth.forgotPasswordSub}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success} style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>{message}</div>}
          
          <div className={styles.inputGroup}>
            <label>{t.auth.email}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder={t.auth.email}
              required
            />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? t.auth.sending : t.auth.sendEmail}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>← {t.auth.backToLogin}</Link>
        </div>
      </div>
    </div>
  );
}
