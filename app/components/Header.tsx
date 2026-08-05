"use client";

import Link from "next/link";
import { useI18n } from "../contexts/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./Header.module.css";

export function Header() {
  const { t } = useI18n();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>Zerey</Link>
      <nav className={styles.nav}>
        <Link href="/">{t.nav.home}</Link>
        <Link href="/search">{t.nav.search}</Link>
        <Link href="/library">{t.nav.library}</Link>
        <Link href="/profile">{t.nav.profile}</Link>
        <Link href="/roadmap" style={{ color: '#2ecc71', fontWeight: 'bold' }}>Roadmap</Link>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}
