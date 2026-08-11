"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import styles from "./reviews.module.css";
import { saveReview, voteReview, ReviewData } from "../../actions/reviews";

export default function ReviewsSection({ 
  gameId, 
  stats, 
  reviews, 
  currentUser 
}: { 
  gameId: number; 
  stats: any; 
  reviews: any[]; 
  currentUser: any 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  const userReview = reviews.find(r => r.userId === currentUser?.id);

  // Form State
  const [score, setScore] = useState<number>(userReview?.score || 10);
  const [reviewText, setReviewText] = useState(userReview?.reviewText || "");
  const [containsSpoiler, setContainsSpoiler] = useState(userReview?.containsSpoiler === 1);
  const [recommended, setRecommended] = useState(userReview?.recommended !== 0);

  const dist = stats?.scoreDistribution ? JSON.parse(stats.scoreDistribution) : {};
  const maxDist = Math.max(...Object.values(dist as Record<string, number>), 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Você precisa estar logado para avaliar.");
    
    setIsSubmitting(true);
    const data: ReviewData = {
      gameId,
      score,
      reviewText,
      containsSpoiler: containsSpoiler ? 1 : 0,
      recommended: recommended ? 1 : 0
    };
    
    const res = await saveReview(data);
    setIsSubmitting(false);
    
    if (res.success) {
      setIsFormOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleVote = async (reviewId: number, isHelpful: number) => {
    if (!currentUser) return alert("Faça login para votar.");
    await voteReview(reviewId, isHelpful);
  };

  return (
    <div className={styles.reviewsContainer} id="reviews">
      <div className={styles.actionsHeader}>
        <h2>Avaliações da Comunidade</h2>
        {currentUser && (
          <button className={styles.writeReviewBtn} onClick={() => setIsFormOpen(true)}>
            {userReview ? "Editar Avaliação" : "Avaliar Jogo"}
          </button>
        )}
      </div>

      {/* Stats Header */}
      <div className={styles.statsHeader}>
        <div className={styles.scoreBox}>
          <div className={styles.bigScore}>{stats?.averageScore || "0.0"}<span className={styles.maxScore}>/10</span></div>
          <div className={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} fill={i < Math.round((stats?.averageScore || 0)/2) ? "#fbbf24" : "none"} stroke="#fbbf24" />
            ))}
          </div>
          <div className={styles.reviewCount}>{stats?.reviewCount || 0} avaliações</div>
          <div style={{ marginTop: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
            {stats?.recommendationPercentage || 0}% recomendam
          </div>
        </div>

        <div className={styles.distributionBox}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(s => {
            const count = dist[s.toString()] || 0;
            const percent = (count / maxDist) * 100;
            return (
              <div key={s} className={styles.distRow}>
                <div className={styles.distLabel}>{s}</div>
                <div className={styles.distBarWrapper}>
                  <div className={styles.distBar} style={{ width: `${percent}%` }} />
                </div>
                <div className={styles.distCount}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className={styles.reviewList}>
        {reviews.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userMeta}>
                  <Image 
                    src={review.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed="+review.userId} 
                    alt={review.username} 
                    width={40} 
                    height={40} 
                    className={styles.avatar} 
                  />
                  <div>
                    <div className={styles.userName}>
                      {review.username}
                      {review.role === 'ADMIN' && <span className={styles.roleBadge}>STAFF</span>}
                    </div>
                    <div className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div className={styles.reviewScore}>
                  <Star fill="#fbbf24" size={16} /> {review.score}/10
                </div>
              </div>

              <div className={styles.reviewBadges}>
                {review.recommended === 1 ? (
                  <span className={styles.badge} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <ThumbsUp size={12} style={{marginRight: 4}}/> Recomendado
                  </span>
                ) : (
                  <span className={styles.badge} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <ThumbsDown size={12} style={{marginRight: 4}}/> Não recomendado
                  </span>
                )}
                {review.progressStatus === 'COMPLETED' && <span className={styles.badge}>✔️ Zerei</span>}
                {review.playedHours > 0 && <span className={styles.badge}>⌚ {review.playedHours}h jogadas</span>}
                {review.platform && <span className={styles.badge}>🎮 {review.platform}</span>}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                {review.containsSpoiler === 1 && !revealedSpoilers[review.id] ? (
                  <div className={styles.spoilerWarning} onClick={() => setRevealedSpoilers(prev => ({...prev, [review.id]: true}))}>
                    <AlertTriangle size={24} />
                    <strong>Esta avaliação contém spoilers</strong>
                    <span>Clique para revelar</span>
                  </div>
                ) : (
                  <div className={styles.reviewBody}>{review.reviewText || "O usuário não deixou um comentário escrito."}</div>
                )}
              </div>

              <div className={styles.reviewFooter}>
                <div className={styles.helpfulSection}>
                  <span className={styles.helpfulText}>Esta análise foi útil?</span>
                  <div className={styles.voteBtns}>
                    <button className={styles.voteBtn} onClick={() => handleVote(review.id, 1)}>
                      <ThumbsUp size={14} /> {review.helpful_count || 0}
                    </button>
                    <button className={styles.voteBtn} onClick={() => handleVote(review.id, 0)}>
                      <ThumbsDown size={14} /> {review.unhelpful_count || 0}
                    </button>
                  </div>
                </div>
                {currentUser?.id === review.userId && (
                  <button className={styles.voteBtn} onClick={() => setIsFormOpen(true)}>Editar</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Avaliação */}
      {isFormOpen && (
        <div className={styles.formModalOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>Sua Avaliação</h2>
              <button className={styles.closeBtn} onClick={() => setIsFormOpen(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nota Geral (0 a 10)</label>
                <div className={styles.scoreInputContainer}>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    className={styles.scoreRange}
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                  />
                  <div className={styles.scoreDisplay}>{score}</div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Recomendação</label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={recommended} onChange={e => setRecommended(e.target.checked)} />
                  Eu recomendo este jogo para outras pessoas
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Análise Escrita (Opcional)</label>
                <textarea 
                  className={styles.textArea} 
                  placeholder="Conte-nos o que achou da história, gameplay, gráficos..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel} style={{ color: '#ef4444' }}>
                  <input type="checkbox" checked={containsSpoiler} onChange={e => setContainsSpoiler(e.target.checked)} />
                  Minha análise contém SPOILERS da história
                </label>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Publicar Avaliação"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
