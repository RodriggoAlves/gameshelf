"use client";

import styles from "./Footer.module.css";
import { useI18n } from "../contexts/I18nContext";
import Link from "next/link";

export function Footer() {
  const { t } = useI18n();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <h3>Zerey</h3>
          <p>Organize sua biblioteca de jogos, descubra novos títulos e compartilhe a sua experiência com a comunidade gamer.</p>
        </div>
        <div className={styles.links}>
          <h4>Plataforma</h4>
          <Link href="/">{t.nav.home}</Link>
          <Link href="/search">{t.nav.search}</Link>
          <Link href="/library">{t.nav.library}</Link>
        </div>
        <div className={styles.links}>
          <h4>Comunidade</h4>
          <Link href="#">Discord</Link>
          <Link href="#">Twitter (X)</Link>
          <Link href="#">GitHub</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Zerey. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
