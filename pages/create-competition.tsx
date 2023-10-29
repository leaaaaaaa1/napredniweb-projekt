import { getSession } from '@auth0/nextjs-auth0';
import styles from '../styles/formStyles.module.css';
import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';


export default function CreateCompetition({ auth0Id }) {

  function useRequireLogin() {
    const { user, isLoading } = useUser();
    const router = useRouter();
  
    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [isLoading, user]);
  }
    const [formData, setFormData] = useState({
        name: '',
        competitors: '',
        winPoints: '',
        drawPoints: '',
        lossPoints: '',
        creatorId: auth0Id
    });

    const [formError, setFormError] = useState('');

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    }

    const handleLogout = () => {
        window.location.assign('/logout');
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const winPoints = parseInt(formData.winPoints, 10);
        const drawPoints = parseInt(formData.drawPoints, 10);
        const lossPoints = parseInt(formData.lossPoints, 10);
    
        if (isNaN(winPoints) || isNaN(drawPoints) || isNaN(lossPoints)) {
            return;
        }

        setFormError('');

        const competitorsArray = formData.competitors.split(',').map(item => item.trim());

        if (competitorsArray.length < 4 || competitorsArray.length > 8) {
            return;
        }
    
        const updatedFormData = { ...formData, winPoints, drawPoints, lossPoints};
    
        try {
            const response = await fetch('/api/createCompetition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFormData)
            });
    
            const data = await response.json();
            if (response.ok) {
              if (data.id) {
                window.location.href = `/schedule/${data.id}`; 
              }
            
              } else {
                console.error(data.error);
              }
              
        } catch (error) {
        }
    }
    

  return (
    <div className={styles.container}>
      <form className={styles.forma} onSubmit={handleSubmit}>
        <h1 className={styles.heading}>Kreiraj novo natjecanje</h1>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Naziv natjecanja:
            <input 
                    className={styles.input} 
                    name="name" 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={handleInputChange}
                />
          </label>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Natjecatelji(odvojeni zarezom):
            <input className={styles.input} name="competitors" type="text" required value={formData.competitors}
                    onChange={handleInputChange}/>
          </label>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Bodovi za pobjedu:
            <input className={styles.input} name="winPoints" type="number" required value={formData.winPoints}
                    onChange={handleInputChange}/>
          </label>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Bodovi za neriješeno:
            <input className={styles.input} name="drawPoints" type="number" required value={formData.drawPoints}
                    onChange={handleInputChange}/>
          </label>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Bodovi za poraz:
            <input className={styles.input} name="lossPoints" type="number" required value={formData.lossPoints}
                    onChange={handleInputChange}/>
          </label>
        </div>
        {formError && <p className={styles.errorMessage}>{formError}</p>}
        <div className={styles.buttonContainer}>
            <button className={styles.submitBtn} type="button" onClick={() => window.location.href = `/`}>Nazad</button>
            <button className={styles.submitBtn} type="submit">Kreiraj natjecanje</button>
        </div>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
    const session = getSession(context.req, context.res);
    
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/api/auth/login',
          permanent: false,
        },
      };
    }
    
    return {
        props: {
            auth0Id: session.user.sub, 
        },
    };
}