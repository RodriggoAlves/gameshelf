import styles from './loading.module.css';

export default function Loading() {
  // Skeleton com 10 cards pulsantes para dar a ideia de conteúdo carregando
  return (
    <div className={styles.container}>
      <div className={styles.title}></div>
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.card}></div>
        ))}
      </div>
    </div>
  );
}
