// pages/api/fetchCompetitors.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const competitionId = Number(req.query.id);

    if(!competitionId) {
        return res.status(400).json({ error: 'Invalid competition id' });
    }

    try {
        const competitors = await prisma.competitor.findMany({
            where: { competitionId: competitionId }
        });

        return res.json(competitors);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch competitors' });
    }
}
