export type QRCodeTargetType = "streetDog" | "supportPoint";

export type QRCodeRecord = {
  id: string;
  targetType: QRCodeTargetType;
  targetId: string;
  publicPath: string;
  createdAt?: unknown;
  createdByUserId: string;
  isActive: boolean;
};
