"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyAccount } from "../actions/auth";
import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import styles from "../login/auth.module.css";

function VerifyAccountContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useI18n();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de verificação ausente.");
      return;
    }

    verifyAccount(token).then((res) => {
      if (res.error) {
        setStatus("error");
        setErrorMessage(res.error);
      } else {
        setStatus("success");
        setTimeout(() => {
          router.push("/library");
          router.refresh();
        }, 3000);
      }
    }).catch(() => {
      setStatus("error");
      setErrorMessage("Ocorreu um erro ao verificar a conta.");
    });
  }, [token, router]);

  return (
    <div className={styles.authCard}>
      {status === "loading" && (
        <>
          <h1 className={styles.title}>Verificando conta...</h1>
          <p className={styles.subtitle}>Aguarde um momento enquanto validamos seu token.</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className={styles.title} style={{ color: '#00f0ff' }}>Conta Verificada! 🎉</h1>
          <p className={styles.subtitle} style={{ marginBottom: '20px' }}>
            Sua conta foi ativada com sucesso. Você está sendo redirecionado para sua biblioteca...
          </p>
          <div className={styles.footer}>
            <Link href="/library" className={styles.link}>Clique aqui se não for redirecionado</Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className={styles.title} style={{ color: '#e74c3c' }}>Falha na Verificação</h1>
          <div className={styles.error} style={{ marginTop: '20px' }}>{errorMessage}</div>
          <div className={styles.footer} style={{ marginTop: '20px' }}>
            <Link href="/login" className={styles.link}>← {t.auth.backToLogin}</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.authCard}>Carregando...</div>}>
        <VerifyAccountContent />
      </Suspense>
    </div>
  );
}
