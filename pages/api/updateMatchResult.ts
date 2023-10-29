// pages/api/updateMatchResult.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    
      const session = getSession(req, res);
      if (!session || !session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
    
      const userId = session.user.sub;
      const { matchId, homeScore, awayScore } = req.body;
    
      try {
        const match = await prisma.match.findUnique({
          where: {
            id: matchId,
          },
          include: {
            round: {
              include: {
                competition: true,
              },
            },
          },
        });
    
        if (!match) {
          return res.status(404).json({ message: 'Match not found' });
        }
    
        if (match.round.competition.creatorId !== userId) {
          return res.status(403).json({ message: 'You are not authorized to update this match' });
        }
    
        if (match.homeScore === homeScore && match.awayScore === awayScore) {
            return res.status(200).json(match);
        }
    
        const getWinner = (home: number, away: number) => {
            if (home > away) return 'home';
            if (home < away) return 'away';
            return 'draw';
        }

        const oldWinner = getWinner(match.homeScore, match.awayScore);
        const newWinner = getWinner(homeScore, awayScore);

        const updatedMatch = await prisma.match.update({
            where: {
                id: matchId,
            },
            data: {
                homeScore,
                awayScore,
            },
        });

        const competition = await prisma.competition.findUnique({
            where: {
                id: updatedMatch.competitionId,
            },
        });

        const updatePoints = async (competitorId: number, incrementValue: number) => {
            await prisma.competitor.update({
                where: {
                    id: competitorId,
                },
                data: {
                    points: {
                        increment: incrementValue,
                    },
                },
            });
        }
    
        if (match.homeScore !== null && match.awayScore !== null) {
            if (oldWinner === 'home') {
                await updatePoints(updatedMatch.homeCompetitorId, -competition.winPoints);
                await updatePoints(updatedMatch.awayCompetitorId, -competition.lossPoints);
            } else if (oldWinner === 'away') {
                await updatePoints(updatedMatch.awayCompetitorId, -competition.winPoints);
                await updatePoints(updatedMatch.homeCompetitorId, -competition.lossPoints);
            } else if (oldWinner === 'draw') {
                await updatePoints(updatedMatch.homeCompetitorId, -competition.drawPoints);
                await updatePoints(updatedMatch.awayCompetitorId, -competition.drawPoints);
            }
        }
    
        if (newWinner === 'home') {
            await updatePoints(updatedMatch.homeCompetitorId, competition.winPoints);
            await updatePoints(updatedMatch.awayCompetitorId, competition.lossPoints);
        } else if (newWinner === 'away') {
            await updatePoints(updatedMatch.awayCompetitorId, competition.winPoints);
            await updatePoints(updatedMatch.homeCompetitorId, competition.lossPoints);
        } else if (newWinner === 'draw') {
            await updatePoints(updatedMatch.homeCompetitorId, competition.drawPoints);
            await updatePoints(updatedMatch.awayCompetitorId, competition.drawPoints);
        }
    
        return res.status(200).json(updatedMatch);
  } catch (error) {
  }
}
