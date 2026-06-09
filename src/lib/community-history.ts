import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export type CommunityHistoryType =
  | "created"
  | "edited"
  | "approved"
  | "rejected"
  | "duplicated";

export function recordStreetDogHistory(
  db: Firestore,
  payload: {
    streetDogId: string;
    type: CommunityHistoryType;
    description: string;
    createdByUserId: string;
    isPublic?: boolean;
  },
) {
  return addDoc(collection(db, "streetDogUpdates"), {
    streetDogId: payload.streetDogId,
    type: payload.type,
    description: payload.description,
    createdByUserId: payload.createdByUserId,
    isPublic: payload.isPublic === true,
    createdAt: serverTimestamp(),
  });
}

export function recordSupportPointHistory(
  db: Firestore,
  payload: {
    supportPointId: string;
    type: CommunityHistoryType;
    description: string;
    createdByUserId: string;
    isPublic?: boolean;
  },
) {
  return addDoc(collection(db, "supportPointUpdates"), {
    supportPointId: payload.supportPointId,
    type: payload.type,
    description: payload.description,
    createdByUserId: payload.createdByUserId,
    isPublic: payload.isPublic === true,
    createdAt: serverTimestamp(),
  });
}
