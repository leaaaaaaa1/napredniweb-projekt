import React, { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import styles from '../styles/homePage.module.css';

const HomePage: React.FC = () => {
  const { user, error, isLoading } = useUser();

  const addUserToDatabase = async () => {
    if (user) {
      const response = await fetch('/api/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          sub: user.sub,
        }),
      });
      const data = await response.json();
      console.log(data);
    }
  };

  useEffect(() => {
    if (user) {
      addUserToDatabase();
    }
  }, [user]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className={styles.background}>
      <div className={styles.homeContainer}>
        <h1 className={styles.homeHeading}>Dobrodošli na pravljenje natjecanja!</h1>
        {!user ? (
          <a href="/login" className={styles.homeLink}>Login</a>
        ) : (
          <>
            <p>Pozdrav, {user.name}!</p>
            <div className={styles.buttonContainer}>  {/* New container div for buttons */}
              <Link href="/create-competition" passHref>
                <div className={styles.homeLink}>Kreiraj natjecanje</div>
              </Link>
              <Link href="/my-competitions" passHref>  {/* New Link for Pregled natjecanja */}
                <div className={styles.homeLink}>Pregled natjecanja</div>
              </Link>
            </div>
            <a href="/logout" className={styles.homeLink}>Odjavi se</a>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
