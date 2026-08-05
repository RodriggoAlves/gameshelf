import Link from "next/link";
import styles from "./roadmap.module.css";
import * as LucideIcons from "lucide-react";

export default function RoadmapPage() {
  const features = [
    {
      title: "Sistema Social & Feed de Amigos",
      description: "Acompanhe seus amigos em tempo real. Veja quando platinarem um jogo ou adicionarem uma review, curta e comente nas atividades deles para deixar a plataforma viva.",
      icon: "Users",
      status: "Em Breve"
    },
    {
      title: "Reviews & Rankings Comunitários",
      description: "Torne-se um crítico reconhecido! O Zerey terá um agregador de notas da comunidade, permitindo ler análises de outros jogadores e ver o cobiçado Top 100 da plataforma.",
      icon: "Star",
      status: "Planejado"
    },
    {
      title: "Coleções Customizadas",
      description: "Crie suas próprias listas como 'Minha Maratona de Resident Evil' ou 'Melhores RPGs do PS2', e exiba-as em destaque no seu Hub de Perfil.",
      icon: "ListVideo",
      status: "Planejado"
    },
    {
      title: "Desafios Zerey",
      description: "Eventos sazonais e desafios da comunidade. Ex: 'Termine 3 jogos de terror no mês do Halloween' para ganhar Badges exclusivas e limite de tempo.",
      icon: "Trophy",
      status: "Ideação"
    },
    {
      title: "Integração HLTB (HowLongToBeat)",
      description: "Veja imediatamente o tempo médio que as pessoas levam para zerar o jogo antes mesmo de adicioná-lo à sua biblioteca.",
      icon: "Clock",
      status: "Pesquisa"
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>O Futuro do Zerey</h1>
        <p className={styles.subtitle}>
          Estamos apenas começando. Veja o que está no nosso horizonte para transformar o Zerey na maior plataforma social de gerenciamento de games.
        </p>
      </div>

      <div className={styles.timeline}>
        {features.map((feat, index) => {
          const IconComp = (LucideIcons as any)[feat.icon] || LucideIcons.Rocket;
          
          return (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                <IconComp size={28} className={styles.icon} />
              </div>
              <div className={styles.content}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{feat.title}</h2>
                  <span className={`${styles.badge} ${styles['badge' + feat.status.replace(' ', '')]}`}>
                    {feat.status}
                  </span>
                </div>
                <p className={styles.cardDesc}>{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <p>Tem uma ideia genial para a plataforma?</p>
        <Link href="/" className={styles.homeBtn}>Voltar para o Início</Link>
      </div>
    </div>
  );
}
