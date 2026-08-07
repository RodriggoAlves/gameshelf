"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, requestPasswordReset } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "./auth.module.css";
import * as LucideIcons from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // States for password reset flow
  const [resetEmail, setResetEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const router = useRouter();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, showForgot]);

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!username.trim()) {
        setError("Por favor, identifique-se.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showForgot) {
        handleForgotSubmit(e);
      } else if (step === 1) {
        handleNext();
      } else if (step === 2) {
        handleSubmit(e);
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Insira sua senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await login(username, password);
      if (res.error) {
        setError(res.error);
        if (res.unverified) {
          // If unverified, keep them on step 2 but they can't login
        } else {
          // Wrong password, maybe go back to step 2
          setStep(2);
        }
        setLoading(false);
      } else {
        router.push("/library");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar ao sistema.");
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setError("Insira um e-mail válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await requestPasswordReset(resetEmail);
      if (res.error) {
        setError(res.error);
      } else {
        setResetSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  }

  // Se estiver na tela de recuperação de senha
  if (showForgot) {
    return (
      <div className={styles.container}>
        <div className={styles.authFooter}>
          <button onClick={() => setShowForgot(false)} className={styles.link} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Voltar para o Login
          </button>
        </div>

        <div className={styles.conversationalWrapper}>
          {error && <div className={styles.error}>{error}</div>}
          
          {resetSuccess ? (
            <div className={styles.stepContainer} style={{ textAlign: "center" }}>
              <LucideIcons.MailCheck size={64} color="#00f0ff" style={{ margin: "0 auto 2rem" }} />
              <h1 className={styles.stepTitle}>E-mail enviado!</h1>
              <p className={styles.stepSubtitle}>
                Se houver uma conta com o e-mail <strong>{resetEmail}</strong>, você receberá um link de redefinição em breve.
              </p>
              <div className={styles.actionRow} style={{ justifyContent: "center" }}>
                <button onClick={() => setShowForgot(false)} className={styles.secondaryBtn}>
                  Voltar para o Login
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.stepContainer}>
              <h1 className={styles.stepTitle}>Esqueceu a senha?</h1>
              <p className={styles.stepSubtitle}>Qual é o e-mail cadastrado na sua conta Zerey?</p>
              <div className={styles.inputGroup}>
                <input 
                  ref={inputRef}
                  type="email" 
                  value={resetEmail} 
                  onChange={e => setResetEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.conversationalInput}
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                />
              </div>
              <div className={styles.actionRow}>
                <button onClick={handleForgotSubmit} className={styles.primaryBtn} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Link"} <LucideIcons.Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authFooter}>
        <Link href="/register" className={styles.link}>Criar uma nova conta</Link>
      </div>

      <div className={styles.conversationalWrapper}>
        {error && <div className={styles.error}>{error}</div>}

        {step === 1 && (
          <div key="step1" className={styles.stepContainer}>
            <h1 className={styles.stepTitle}>Identifique-se.</h1>
            <p className={styles.stepSubtitle}>Qual o seu usuário ou e-mail cadastrado?</p>
            <div className={styles.inputGroup}>
              <input 
                ref={inputRef}
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.conversationalInput}
                placeholder="Usuário ou E-mail"
                autoComplete="username"
              />
            </div>
            <div className={styles.actionRow}>
              <button onClick={handleNext} className={styles.primaryBtn}>
                OK <LucideIcons.Check size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="step2" className={styles.stepContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,240,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f0ff' }}>
                <LucideIcons.User size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>Logando como</div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{username}</div>
              </div>
            </div>

            <h1 className={styles.stepTitle}>Digite sua senha.</h1>
            <p className={styles.stepSubtitle}>Autorize seu acesso ao sistema Zerey.</p>
            
            <div className={styles.inputGroup}>
              <input 
                ref={inputRef}
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.conversationalInput}
                placeholder="Sua senha secreta..."
                autoComplete="current-password"
              />
            </div>
            <div className={styles.actionRow}>
              <button onClick={handleSubmit} className={styles.primaryBtn} disabled={loading}>
                {loading ? "Acessando..." : "Entrar no Sistema"} 
                {!loading && <LucideIcons.Terminal size={18} />}
              </button>
              <button onClick={() => setStep(1)} className={styles.secondaryBtn} disabled={loading}>
                Trocar Usuário
              </button>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <button 
                onClick={() => {
                  if (username.includes('@')) setResetEmail(username);
                  setShowForgot(true);
                }} 
                className={styles.link}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Esqueci minha senha
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          {[1, 2].map(s => (
            <div 
              key={s} 
              className={`${styles.progressDot} ${s === step ? styles.active : ''} ${s < step ? styles.completed : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
