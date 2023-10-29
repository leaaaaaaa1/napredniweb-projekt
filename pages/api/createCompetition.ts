import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, competitors: competitorsStr, winPoints, drawPoints, lossPoints, creatorId } = req.body;

    if (!creatorId) {
      return res.status(400).json({ error: 'creatorId is required' });
    }

    const competitors = competitorsStr.split(',').map(c => c.trim());

    try {
      const newCompetition = await prisma.competition.create({
        data: {
          name,
          winPoints,
          drawPoints,
          lossPoints,
          creatorId,
        },
      });

      await Promise.all(
        competitors.map((competitor) => 
          prisma.competitor.create({  
            data: {
              name: competitor,
              competitionId: newCompetition.id,
            }
          })
        )
      );
      
      const schedules = {
        4: [[[1,2], [3,4]], [[1,3], [2,4]], [[1,4], [2,3]]],
        5: [[[1,2], [3,4]], 
            [[1,3], [4,5]], 
            [[1,4], [2,5]], 
            [[1,5], [2,3]], 
            [[2,4], [3,5]]],
        6: [[[1,2], [3,4], [5,6]], 
            [[1,3], [2,5], [4,6]], 
            [[1,4], [2,6], [3,5]], 
            [[1,5], [2,4], [3,6]], 
            [[1,6], [2,3], [4,5]]],
        7: [[[1,5], [2,7], [3,6]], 
            [[1,4], [3,5], [6,7]], 
            [[1,3], [2,5], [4,6]], 
            [[2,3], [4,7], [5,6]], 
            [[1,6], [2,4], [5,7]],
            [[1,7], [2,6], [3,4]], 
            [[1,2], [3,7], [4,5]]],
        8: [[[1,2], [3,4], [5,6], [7,8]], 
            [[1,3], [2,4], [5,7], [6,8]], 
            [[1,4], [2,3], [5,8], [6,7]], 
            [[1,5], [2,6], [3,7], [4,8]], 
            [[1,6], [2,7], [3,8], [4,5]], 
            [[1,7], [2,8], [3,5], [4,6]], 
            [[1,8], [2,5], [3,6], [4,7]]]
      };
      
      const competitorsCount = competitors.length;
      const selectedSchedule = schedules[competitorsCount];

      for (let i = 0; i < selectedSchedule.length; i++) {
        const round = await prisma.round.create({
            data: {
                roundNumber: i + 1,
                competitionId: newCompetition.id
            }
        });
    
        for (let j = 0; j < selectedSchedule[i].length; j++) {
            const [home, away] = selectedSchedule[i][j];
        
            if (home > competitorsCount || away > competitorsCount) continue; 

            const homeCompetitorData = await prisma.competitor.findFirst({
              where: { 
                  name: competitors[home - 1],
                  competitionId: newCompetition.id
              }
            });
            const awayCompetitorData = await prisma.competitor.findFirst({
                where: {
                    name: competitors[away - 1],
                    competitionId: newCompetition.id
                }
            });
                    
    
            if (!homeCompetitorData || !awayCompetitorData) {
                throw new Error(`Failed to find competitors for the match: ${competitors[home - 1]} vs ${competitors[away - 1]}`);
            }
    
            await prisma.match.create({
                data: {
                    homeCompetitorId: homeCompetitorData.id,
                    awayCompetitorId: awayCompetitorData.id,
                    roundId: round.id,
                    competitionId: newCompetition.id
                }
            });
        }        
    }
    
      
      return res.status(200).json(newCompetition);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
