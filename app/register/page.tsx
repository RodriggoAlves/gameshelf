"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { register } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "../login/auth.module.css";
import * as LucideIcons from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const router = useRouter();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && step < 4) {
      inputRef.current.focus();
    }
  }, [step]);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, text: "", color: "transparent" };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, text: "Fraca", color: "#ff0055" };
    if (score <= 3) return { score, text: "Média", color: "#eab308" };
    return { score, text: "Forte", color: "#00f0ff" };
  };

  const strength = getPasswordStrength(password);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!validateEmail(email)) {
        setError("Por favor, insira um e-mail válido.");
        return;
      }
    } else if (step === 2) {
      if (username.length < 3) {
        setError("O nome de usuário precisa ter pelo menos 3 caracteres.");
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError("Apenas letras, números, traços e underlines.");
        return;
      }
    } else if (step === 3) {
      if (strength.score < 3) {
        setError("Sua senha é muito fraca. Tente misturar letras, números e símbolos.");
        return;
      }
    }
    
    setStep(s => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Você precisa aceitar os Termos de Uso para continuar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
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
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro interno. Tente novamente ou verifique suas credenciais.");
      setLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className={styles.container}>
        <div className={styles.conversationalWrapper} style={{ textAlign: "center" }}>
          <LucideIcons.MailCheck size={64} color="#00f0ff" style={{ margin: "0 auto 2rem" }} />
          <h1 className={styles.stepTitle}>Verifique seu e-mail</h1>
          <p className={styles.stepSubtitle}>
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar sua conta.
          </p>
          <Link href="/login" className={styles.secondaryBtn}>← Ir para o Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authFooter}>
        <Link href="/login" className={styles.link}>Já tenho uma conta</Link>
      </div>

      <div className={styles.conversationalWrapper}>
        {error && <div className={styles.error}>{error}</div>}

        {step === 1 && (
          <div key="step1" className={styles.stepContainer}>
            <h1 className={styles.stepTitle}>Qual é o seu melhor e-mail?</h1>
            <p className={styles.stepSubtitle}>Vamos usá-lo para proteger sua conta e recuperar seu acesso se precisar.</p>
            <div className={styles.inputGroup}>
              <input 
                ref={inputRef}
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.conversationalInput}
                placeholder="nome@exemplo.com"
                autoComplete="email"
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
            <h1 className={styles.stepTitle}>Como devemos te chamar?</h1>
            <p className={styles.stepSubtitle}>Escolha seu nome de usuário. Esse será o seu @ na comunidade Zerey.</p>
            <div className={styles.inputGroup}>
              <input 
                ref={inputRef}
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.conversationalInput}
                placeholder="Ex: SolidSnake99"
                autoComplete="username"
              />
            </div>
            <div className={styles.actionRow}>
              <button onClick={handleNext} className={styles.primaryBtn}>
                OK <LucideIcons.Check size={18} />
              </button>
              <button onClick={() => setStep(1)} className={styles.secondaryBtn}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div key="step3" className={styles.stepContainer}>
            <h1 className={styles.stepTitle}>Crie uma senha forte.</h1>
            <p className={styles.stepSubtitle}>Proteja seu loot. Use letras, números e símbolos.</p>
            <div className={styles.inputGroup}>
              <input 
                ref={inputRef}
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.conversationalInput}
                placeholder="Senha secreta..."
              />
              {password.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                    <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 2 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                    <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                    <div style={{ height: '4px', flex: 1, backgroundColor: strength.score >= 4 ? strength.color : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
                  </div>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.text}</span>
                </div>
              )}
            </div>
            <div className={styles.actionRow}>
              <button onClick={handleNext} className={styles.primaryBtn}>
                OK <LucideIcons.Check size={18} />
              </button>
              <button onClick={() => setStep(2)} className={styles.secondaryBtn}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div key="step4" className={styles.stepContainer}>
            <h1 className={styles.stepTitle}>Último passo!</h1>
            <p className={styles.stepSubtitle}>Aceite os termos para iniciarmos o sistema.</p>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptedTerms} 
                  onChange={e => setAcceptedTerms(e.target.checked)} 
                />
                <label htmlFor="terms">
                  Eu concordo que esta plataforma está em fase Beta e li os
                  <span className={styles.termsLink} onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                    Termos de Uso
                  </span>.
                </label>
              </div>
              
              <div className={styles.actionRow} style={{ marginTop: '3rem' }}>
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                  {loading ? "Iniciando Sistema..." : "Finalizar Cadastro"} 
                  {!loading && <LucideIcons.Terminal size={18} />}
                </button>
                <button type="button" onClick={() => setStep(3)} className={styles.secondaryBtn} disabled={loading}>
                  Voltar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`${styles.progressDot} ${s === step ? styles.active : ''} ${s < step ? styles.completed : ''}`}
            />
          ))}
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
              Li e Aceito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
