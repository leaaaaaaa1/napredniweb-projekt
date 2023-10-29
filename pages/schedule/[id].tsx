import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import prisma from '../../lib/prisma';
import { useUser } from '@auth0/nextjs-auth0';
import styles from '../../styles/SchedulePage.module.css';
import React, { useState, useEffect } from 'react';


interface MatchType {
    id: number;
    homeCompetitor: CompetitorType;
    awayCompetitor: CompetitorType;
    homeScore?: number;
    awayScore?: number;
}

interface RoundType {
    id: number;
    roundNumber: number;
    matches: MatchType[];
}

interface CompetitorType {
    id: number;
    name: string;
    points: number;
}

interface ScheduleProps {
    schedule: {
        name: string;
        creatorId: string;
        rounds: RoundType[];
    };
    competitors: CompetitorType[];
}

interface RankingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCompetitors: CompetitorType[];
}
  
  

const RankingsModal: React.FC<RankingsModalProps> = ({ isOpen, onClose, currentCompetitors }) => {
    const sortedCompetitors = [...currentCompetitors].sort((a, b) => b.points - a.points);
    return isOpen ? (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.updateButton}>Zatvori</button>
                <h2>Bodovni rang</h2>
                <ul>
                    {sortedCompetitors.map((competitor, index) => (
                        <li key={competitor.id}>
                            {index + 1 + "."} {competitor.name}: {competitor.points} bod
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    ) : null;
};


const SchedulePage: NextPage<ScheduleProps> = ({ schedule, competitors }) => {
    const router = useRouter();
    const generateLink = () => {
        return `${window.location.origin}/schedule/${router.query.id}`;
    }
    const { user, isLoading } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCompetitors, setCurrentCompetitors] = useState(competitors);
    const [updateDisabled, setUpdateDisabled] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const copyLinkToClipboard = async () => {
        const link = generateLink();
        try {
          await navigator.clipboard.writeText(link);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 3000); 
          alert("Link kopiran u međuspremnik.")
        } catch (err) {
        }
      }
    
    const updateMatchResult = async (matchId: number) => {
        const homeScoreInput = document.querySelector(`#homeScore_${matchId}`) as HTMLInputElement;
        const awayScoreInput = document.querySelector(`#awayScore_${matchId}`) as HTMLInputElement;
        
        if (homeScoreInput && awayScoreInput) {
            const homeScore = parseInt(homeScoreInput.value, 10);
            const awayScore = parseInt(awayScoreInput.value, 10);
    
            const response = await fetch('/api/updateMatchResult', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    matchId,
                    homeScore,
                    awayScore
                })
            });
    
            if (response.ok) {
                await fetchCompetitors(); 
            } else {
            }
        
            setUpdateDisabled(false);;
        }
    };
    
    const fetchCompetitors = async () => {
        const response = await fetch(`/api/fetchCompetitors?id=${router.query.id}`);
        console.log(response.json);
        if (response.ok) {
            const updatedCompetitors = await response.json();
            setCurrentCompetitors(updatedCompetitors);
        }
    };
    
    return (
        <div className={styles.container}>
            <h1>Raspored za {schedule.name}</h1>
            {!isModalOpen && <button onClick={() => setIsModalOpen(true)} className={styles.updateButton}>Rang lista</button>}
            <RankingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentCompetitors={currentCompetitors} />
            {schedule.rounds.map((round) => (
            <div key={round.id}>
              <h2 className={styles.roundHeader}>{round.roundNumber}. kolo</h2>
                <div key={round.id} className={styles.round}>
                    {round.matches.map((match) => (
                        <div key={match.id} className={styles.match}>
                            <span className={styles.competitors}>
                                {match.homeCompetitor.name} - {match.awayCompetitor.name}
                            </span>
                            {user && user.sub === schedule.creatorId ? (
                                <div className={styles.scoreInput}>
                                    <input type="number" id={`homeScore_${match.id}`} placeholder="Unesi broj" defaultValue={match.homeScore?.toString() || ''} />
                                    <span> - </span>
                                    <input type="number" id={`awayScore_${match.id}`} placeholder="Unesi broj" defaultValue={match.awayScore?.toString() || ''} />
                                    <button onClick={copyLinkToClipboard} className={styles.updateButton}>Generiraj link</button>
                                    <button onClick={() => { setUpdateDisabled(true); updateMatchResult(match.id); }} disabled={updateDisabled} className={styles.updateButton}>Ažuriraj</button>                                  
                                </div>
                            ) : (
                                <div className={styles.scoreDisplay}>
                                    <span>{match.homeScore !== undefined ? match.homeScore : '-'}</span>
                                    <span> - </span>
                                    <span>{match.awayScore !== undefined ? match.awayScore : '-'}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            ))}
            {user && user.sub === schedule.creatorId && (
                                <button 
                                onClick={() => window.location.href = `/my-competitions`} 
                                className={styles.updateButton} 
                              > Nazad
                              </button> 
                            )}  
        </div>
    );
};


export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params!;

    const schedule = await prisma.competition.findUnique({
        where: { id: parseInt(id as string, 10) },
        select: {
            name: true,
            creatorId: true,
            rounds: {
                include: {
                    matches: {
                        include: {
                            homeCompetitor: true, 
                            awayCompetitor: true  
                        }
                    }
                }
            }
        }
    });
    
    

    const competitors = await prisma.competitor.findMany({
        where: {
            competitionId: parseInt(id as string, 10)
        }
    });

    return {
        props: {
            schedule,
            competitors
        }
    };
};

export default SchedulePage;