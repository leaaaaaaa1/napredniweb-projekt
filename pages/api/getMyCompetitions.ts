import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const auth0Id = req.headers.authorization; 

  if (!auth0Id) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const competitions = await prisma.competition.findMany({
      where: {
        creatorId: auth0Id,
      },
      include: {
        matches: true,
        competitors: true,
        rounds: true,
      },
    });

    return res.status(200).json(competitions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
