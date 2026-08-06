"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "../login/auth.module.css";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Token inválido.");
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");

    const res = await resetPassword(token, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setMessage("Senha redefinida com sucesso!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }

  if (!token) {
    return (
      <div className={styles.authCard}>
        <div className={styles.error}>O link de recuperação é inválido ou está faltando o token.</div>
        <div className={styles.footer} style={{ marginTop: '20px' }}>
          <Link href="/login" className={styles.link}>← {t.auth.backToLogin}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authCard}>
      <h1 className={styles.title}>{t.auth.resetTitle}</h1>
      <p className={styles.subtitle}>{t.auth.resetSub}</p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success} style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>{message}</div>}
        
        <div className={styles.inputGroup}>
          <label>{t.auth.password}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            required
            minLength={6}
          />
        </div>
        
        <button type="submit" className={styles.submitBtn} disabled={loading || !!message}>
          {loading ? "..." : t.auth.saveNewPassword}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.authCard}>Carregando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
