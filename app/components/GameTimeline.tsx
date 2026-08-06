import styles from "./timeline.module.css";

export default function GameTimeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) return null;

  const getEventText = (event: any) => {
    switch (event.eventType) {
      case "ADDED":
        return `Adicionado à biblioteca como "${event.newValue}"`;
      case "STATUS_CHANGED":
        return `Status alterado para "${event.newValue}"`;
      case "RATING_UPDATED":
        return `Nota atualizada para ${event.newValue}/100`;
      case "PROGRESS_UPDATED":
        return `Progresso avançou para ${event.newValue}%`;
      case "FAVORITED":
        return `⭐ Adicionado aos Favoritos`;
      case "UNFAVORITED":
        return `Removido dos Favoritos`;
      case "ARCHIVED":
        return `Jogo Arquivado`;
      default:
        return `Atualização registrada`;
    }
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        {events.map((event, idx) => (
          <div key={event.id || idx} className={styles.eventRow}>
            <div className={styles.nodeWrapper}>
              <div className={styles.node}></div>
            </div>
            <div className={styles.content}>
              <div className={styles.text}>{getEventText(event)}</div>
              <div className={styles.date}>{new Date(event.createdAt).toLocaleDateString()} às {new Date(event.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
