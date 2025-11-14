export const generateTransactionId = (type: string = 'QR'): string => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Format: TYPE-YYYYMMDD-TIMESTAMP-RANDOM (e.g., PR-20241201-1701234567890-ABC123)
  return `${type}-${datePart}-${timestamp}-${randomPart}`;
};

export const formatTransactionId = (id: string): string => {
  // Add visual formatting for better readability
  return id.replace(/(.{2})-(.{8})-(.+)-(.+)/, '$1-$2-***-$4');
};

export const validateTransactionId = (id: string): boolean => {
  const pattern = /^QR-\d{8}-\d{13}-[A-Z0-9]{6}$/;
  return pattern.test(id);
};
