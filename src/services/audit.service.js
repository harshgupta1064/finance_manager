import { prisma } from '../config/db.js';

export const logAction = async (tx, { actorId, action, entity, entityId, metadata }) => {
  return tx.auditLog.create({
    data: { actorId, action, entity, entityId, metadata: metadata ?? {} },
  });
};
