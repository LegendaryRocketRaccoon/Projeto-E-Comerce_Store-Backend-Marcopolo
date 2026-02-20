import { ObjectId } from 'mongodb';

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function now() {
  return new Date();
}

function pick(obj, allowed) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => allowed.includes(k)));
}

export { toObjectId, now, pick };
``