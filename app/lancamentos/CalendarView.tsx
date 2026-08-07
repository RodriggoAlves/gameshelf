"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./calendar-view.module.css";
import * as LucideIcons from "lucide-react";

interface CalendarGame {
  id: number;
  name: string;
  cover_url: string;
  rating: number;
  genres: { id: number; name: string }[];
  platforms: { id: number; name: string }[];
}

interface CalendarRelease {
  date: string;
  day: number;
  games: CalendarGame[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [releases, setReleases] = useState<CalendarRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animationClass, setAnimationClass] = useState("");
  const [selectedDay, setSelectedDay] = useState<CalendarRelease | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    async function fetchCalendar() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
        const data = await res.json();
        setReleases(data.releases || []);
      } catch (error) {
        console.error("Error fetching calendar", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCalendar();
  }, [currentMonth, currentYear]);

  const nextMonth = () => {
    setAnimationClass(styles.slideLeftEnter);
    setTimeout(() => setAnimationClass(""), 400);
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setAnimationClass(styles.slideRightEnter);
    setTimeout(() => setAnimationClass(""), 400);
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={prevMonth} disabled={isLoading}>
          <LucideIcons.ChevronLeft size={24} />
        </button>
        <div className={styles.monthTitle}>
          <LucideIcons.CalendarDays size={28} color="var(--accent-cyan)" />
          {MONTHS[currentMonth]} {currentYear}
        </div>
        <button className={styles.navButton} onClick={nextMonth} disabled={isLoading}>
          <LucideIcons.ChevronRight size={24} />
        </button>
      </div>

      <div className={styles.calendarWrapper}>
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <LucideIcons.Loader2 size={48} className={styles.loaderSpinner} />
            <p>Carregando lançamentos...</p>
          </div>
        ) : (
          <div className={`${styles.calendarContent} ${animationClass}`}>
            <div className={styles.weekdays}>
              {WEEKDAYS.map(day => (
                <div key={day} className={styles.weekday}>{day}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {blanks.map(blank => (
                <div key={`blank-${blank}`} className={styles.emptyCell}></div>
              ))}
              
              {days.map(day => {
                const dayReleases = releases.find(r => r.day === day);
                const isToday = isCurrentMonth && today.getDate() === day;
                
                return (
                  <div 
                    key={day} 
                    className={`${styles.dayCell} ${dayReleases ? styles.hasGames : ""} ${isToday ? styles.isToday : ""}`}
                    onClick={() => dayReleases && setSelectedDay(dayReleases)}
                  >
                    <div className={styles.dayNumber}>{day}</div>
                    
                    {dayReleases && (
                      <div className={styles.gameThumbnails}>
                        {dayReleases.games.slice(0, 3).map(game => (
                          <div key={game.id} className={styles.thumbnailWrapper}>
                            {game.cover_url ? (
                              <Image src={game.cover_url} alt={game.name} fill sizes="32px" />
                            ) : (
                              <div style={{width:'100%', height:'100%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <LucideIcons.Gamepad2 size={16} opacity={0.5} />
                              </div>
                            )}
                          </div>
                        ))}
                        {dayReleases.games.length > 3 && (
                          <div className={styles.moreGamesCount}>
                            +{dayReleases.games.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile List View */}
            <div className={styles.listView}>
              {releases.length === 0 ? (
                <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  Nenhum lançamento encontrado para este mês.
                </div>
              ) : (
                releases.sort((a,b)=>a.day-b.day).map(dayRelease => (
                  <div key={dayRelease.day} className={styles.listDay}>
                    <div className={styles.listDayHeader}>
                      {dayRelease.day} de {MONTHS[currentMonth]}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                      {dayRelease.games.map(game => (
                        <Link href={`/game/${game.id}`} key={game.id} className={styles.gameListItem}>
                          <div className={styles.gameListImage}>
                            {game.cover_url ? (
                              <Image src={game.cover_url} alt={game.name} fill sizes="60px" />
                            ) : (
                              <div style={{width:'100%', height:'100%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <LucideIcons.Gamepad2 size={24} opacity={0.5} />
                              </div>
                            )}
                          </div>
                          <div className={styles.gameListInfo}>
                            <div className={styles.gameListName}>{game.name}</div>
                            {game.genres && game.genres.length > 0 && (
                              <div className={styles.gameListGenres}>
                                {game.genres.slice(0, 2).map(g => g.name).join(", ")}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Tooltip */}
      {selectedDay && (
        <div className={styles.dayModalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.dayModal} onClick={e => e.stopPropagation()}>
            <div className={styles.dayModalHeader}>
              <div className={styles.dayModalTitle}>
                <LucideIcons.CalendarCheck size={24} color="var(--accent-cyan)" />
                Lançamentos do dia {selectedDay.day}
              </div>
              <button className={styles.dayModalClose} onClick={() => setSelectedDay(null)}>
                <LucideIcons.X size={24} />
              </button>
            </div>
            <div className={styles.dayModalContent}>
              {selectedDay.games.map(game => (
                <Link href={`/game/${game.id}`} key={game.id} className={styles.gameListItem}>
                  <div className={styles.gameListImage}>
                    {game.cover_url ? (
                      <Image src={game.cover_url} alt={game.name} fill sizes="60px" />
                    ) : (
                      <div style={{width:'100%', height:'100%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <LucideIcons.Gamepad2 size={24} opacity={0.5} />
                      </div>
                    )}
                  </div>
                  <div className={styles.gameListInfo}>
                    <div className={styles.gameListName}>{game.name}</div>
                    <div className={styles.gameListGenres}>
                      {game.genres?.map(g => g.name).join(", ")}
                    </div>
                    <div className={styles.gameListPlatforms}>
                      {game.platforms?.map((p, i) => (
                        <span key={i} className={styles.platformBadge}>{p.name}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
