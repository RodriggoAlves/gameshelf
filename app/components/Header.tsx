"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "../contexts/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import * as LucideIcons from "lucide-react";
import styles from "./Header.module.css";

export function Header({ isAdmin }: { isAdmin?: boolean }) {
  const { t } = useI18n();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image src="/logo.jpg" alt="Zerey Logo" width={32} height={32} style={{ borderRadius: '8px', objectFit: 'cover' }} />
        Zerey
      </Link>
      <nav className={styles.nav}>
        {isAdmin && (
          <Link href="/admin" style={{ color: '#00f0ff', fontWeight: 600 }}>
            <LucideIcons.Shield size={18} style={{ marginRight: '6px' }} />
            <span>Admin</span>
          </Link>
        )}
        <Link href="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>{t.nav.home}</span>
        </Link>
        <Link href="/search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>{t.nav.search}</span>
        </Link>
        <Link href="/lancamentos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span style={{ position: 'relative' }}>
            Lançamentos
            <span className={styles.badge}>NOVO</span>
          </span>
        </Link>
        <Link href="/library">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span>{t.nav.library}</span>
        </Link>
        <Link href="/franquias">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          <span style={{ position: 'relative' }}>
            Franquias
            <span className={styles.badge}>NOVO</span>
          </span>
        </Link>
        <Link href="/comparar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M20 16l4-4-4-4"></path><path d="M4 8l-4 4 4 4"></path></svg>
          <span style={{ position: 'relative' }}>
            Comparar
            <span className={styles.badge}>NOVO</span>
          </span>
        </Link>
        <Link href="/profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>{t.nav.profile}</span>
        </Link>
      </nav>
      <div className={styles.desktopLang}>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
