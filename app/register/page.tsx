"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, text: "", color: "transparent" };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, text: "Fraca", color: "#ef4444" };
    if (score <= 3) return { score, text: "Média", color: "#eab308" };
    return { score, text: "Forte", color: "#22c55e" };
  };

  const strength = getPasswordStrength(password);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Você precisa aceitar os Termos de Uso.");
      setLoading(false);
      return;
    }

    const res = await register(username, email, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.requireVerification) {
      setVerificationSent(true);
      setLoading(false);
    } else {
      router.push("/profile");
      router.refresh();
    }
  }

  if (verificationSent) {
    return (
      <div className={styles.container}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>{t.auth.checkEmailTitle || "Verifique seu e-mail"}</h1>
          <p className={styles.subtitle} style={{ marginBottom: '20px' }}>
            {t.auth.checkEmailSub || "Enviamos um link de confirmação para o e-mail cadastrado. Clique no link para ativar sua conta e acessar a plataforma."}
          </p>
          <div className={styles.footer}>
            <Link href="/login" className={styles.link}>← {t.auth.backToLogin}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Crie sua conta</h1>
        <p className={styles.subtitle}>E comece a organizar sua biblioteca Zerey</p>
        
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
            <label>{t.auth.email}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder={t.auth.email}
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
            {password.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 1 ? strength.color : '#333', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 2 ? strength.color : '#333', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 3 ? strength.color : '#333', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 4 ? strength.color : '#333', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                </div>
                <span style={{ color: strength.color }}>{strength.text}</span>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>{t.auth.confirmPassword}</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t.auth.confirmPassword}
              required
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptedTerms} 
              onChange={e => setAcceptedTerms(e.target.checked)} 
            />
            <label htmlFor="terms">
              {t.auth.termsText}<span className={styles.termsLink} onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>{t.auth.termsLink}</span>
            </label>
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? t.auth.registering : t.auth.register}
          </button>
        </form>

        <div className={styles.footer}>
          {t.auth.hasAccount} <Link href="/login" className={styles.link}>{t.auth.login}</Link>
        </div>
      </div>

      {showTerms && (
        <div className={styles.termsModal} onClick={() => setShowTerms(false)}>
          <div className={styles.termsContent} onClick={e => e.stopPropagation()}>
            <h2>TERMO DE CIÊNCIA E ACEITE – PLATAFORMA EM FASE DE TESTES (BETA)</h2>
            <p>Última atualização: 05 de agosto de 2026.</p>
            <p>Ao prosseguir com o cadastro nesta plataforma, o usuário declara que leu, compreendeu e concorda integralmente com os termos e condições abaixo.</p>
            
            <h3>1. Objeto</h3>
            <p>A presente plataforma encontra-se em fase de desenvolvimento e testes (versão Beta), sendo disponibilizada exclusivamente para fins de avaliação, validação de funcionalidades, identificação de falhas e coleta de feedback.</p>
            <p>O usuário reconhece que o sistema poderá sofrer alterações, interrupções, indisponibilidades, correções, atualizações ou até mesmo ser descontinuado, sem aviso prévio.</p>
            
            <h3>2. Natureza Experimental</h3>
            <p>O usuário declara estar ciente de que:</p>
            <ul>
              <li>A plataforma não constitui produto final;</li>
              <li>Funcionalidades podem apresentar erros, inconsistências ou comportamento inesperado;</li>
              <li>Informações cadastradas poderão ser alteradas, removidas ou perdidas em decorrência de atualizações, correções ou falhas técnicas;</li>
              <li>Não há garantia de disponibilidade contínua, estabilidade, desempenho ou funcionamento ininterrupto.</li>
            </ul>

            <h3>3. Ausência de Garantias</h3>
            <p>A plataforma é disponibilizada "no estado em que se encontra" ("as is"), sem garantias expressas ou implícitas de qualquer natureza, incluindo, mas não se limitando, à adequação para finalidade específica, disponibilidade, precisão, confiabilidade ou ausência de falhas.</p>
            
            <h3>4. Limitação de Responsabilidade</h3>
            <p>Na máxima extensão permitida pela legislação aplicável, o desenvolvedor não será responsável por quaisquer danos diretos, indiretos, incidentais, consequenciais, lucros cessantes, perda de dados, interrupção de atividades ou quaisquer prejuízos decorrentes da utilização, impossibilidade de utilização ou funcionamento da plataforma.</p>
            <p>O usuário concorda que utiliza a plataforma por sua própria conta e risco.</p>
            
            <h3>5. Proteção de Dados</h3>
            <p>O usuário compromete-se a não inserir informações sensíveis, confidenciais, sigilosas ou dados cuja perda possa causar prejuízo.</p>
            <p>Embora sejam adotadas boas práticas de desenvolvimento, não é garantida a preservação permanente das informações cadastradas durante o período de testes.</p>
            
            <h3>6. Desenvolvimento Independente</h3>
            <p>O usuário declara estar ciente de que esta plataforma foi desenvolvida como projeto acadêmico e de aprendizado, por um estudante da área de tecnologia, possuindo caráter educacional e experimental.</p>
            <p>Sua disponibilização possui como objetivo o aperfeiçoamento técnico, testes de funcionalidades e obtenção de experiência prática em desenvolvimento de software.</p>
            
            <h3>7. Atualizações</h3>
            <p>Os presentes termos poderão ser alterados a qualquer momento, independentemente de comunicação prévia, sendo recomendada sua consulta periódica.</p>
            
            <h3>8. Aceite</h3>
            <p>Ao selecionar a opção "Li e aceito os Termos de Uso" e concluir o cadastro, o usuário declara que leu integralmente este documento, compreendeu seu conteúdo, está ciente de que a plataforma encontra-se em fase de testes, e aceita as limitações de responsabilidade previstas neste termo.</p>
            
            <button className={styles.closeTermsBtn} onClick={() => { setAcceptedTerms(true); setShowTerms(false); }}>
              {t.auth.termsText}{t.auth.termsLink}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
