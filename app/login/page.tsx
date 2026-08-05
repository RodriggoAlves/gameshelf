"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "./auth.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await login(username, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/library");
      router.refresh();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Bem-vindo de volta</h1>
        <p className={styles.subtitle}>Entre para gerenciar sua biblioteca Zerey</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>{t.auth.username}</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder={t.auth.username}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>{t.auth.password}</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder={t.auth.password}
              required
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '16px', marginTop: '-8px' }}>
            <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.85rem' }}>
              {t.auth.forgotPassword}
            </Link>
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? t.auth.loggingIn : t.auth.login}
          </button>
        </form>

        <div className={styles.footer}>
          {t.auth.noAccount} <Link href="/register" className={styles.link}>{t.auth.register}</Link>
        </div>
      </div>
    </div>
  );
}
