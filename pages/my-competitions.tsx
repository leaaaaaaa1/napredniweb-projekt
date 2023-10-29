import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import styles from '../styles/MyCompetitionsPage.module.css';
import { useRouter } from 'next/router';


interface Competition {
  id: number;
  name: string;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  sharedLink: string;
}

function useRequireLogin() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user]);
}


const MyCompetitions: React.FC = () => {
    useRequireLogin();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const { user, error, isLoading } = useUser();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        if (!user?.sub) return; 

        const res = await fetch('/api/getMyCompetitions', {
          headers: {
            'Authorization': user.sub,
          },
        });

        if (!res.ok) {
        }

        const data = await res.json();
        setCompetitions(data);
      } catch (error) {
      }
    };

    if (!isLoading && user) {
      fetchCompetitions(); 
    }
  }, [isLoading, user]);

  return (
    <div className={styles.container}>
      <h1>Moja natjecanja</h1>
      <div className={styles.competitionHeader}>
        <span className={styles.competitionName}>Ime natjecanja</span>
      </div>
      <div className={styles.competitions}>
        {competitions.map((comp) => (
          <div key={comp.id} className={styles.competition}>
            <span className={styles.competitionName}>{comp.name}</span>
            <button 
              onClick={() => window.location.href = `/schedule/${comp.id}`} 
              className={styles.buttonToCompetition} 
            >
              Ažuriraj ili pogledaj rezultate
            </button>
          </div>
        ))}
      </div>
      <button 
              onClick={() => window.location.href = `/`} 
              className={styles.buttonToCompetition} 
            > Nazad
        </button>        
    </div>
  );
};

export default MyCompetitions;
