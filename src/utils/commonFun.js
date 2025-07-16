export const hasAccess = (userSession, roles) => {
  if (!userSession || !userSession?.user_type) return false;
  return roles?.includes(userSession.user_type);
};

export function isWithinOneHour(checkInTime) {
  if (checkInTime) {
    const currentTime = new Date();
    const [checkInHour, checkInMinute] = checkInTime?.split(":")?.map(Number);

    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

    const timeDiff = checkInDate - currentTime;

    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000;
  }
}

export const removeNullValues = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const cleanObj = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Only add the key-value pair if value is not null or undefined
    if (value !== null && value !== undefined) {
      // If value is an object, recursively clean it
      if (typeof value === "object" && !Array.isArray(value)) {
        cleanObj[key] = removeNullValues(value);
      } else if (Array.isArray(value)) {
        // If value is an array, map through and clean each item
        cleanObj[key] = value.map((item) =>
          typeof item === "object" ? removeNullValues(item) : item
        );
      } else {
        cleanObj[key] = value;
      }
    }
  });

  return cleanObj;
};


export const normalizeString = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z\s]/g, "") // Remove special characters
    .replace(/\blicence\b/g, "license") // Handle "licence" → "license"
    .replace(/\bdl\b/g, "driver license") // Handle "DL" → "driver license"
    .replace(/\bdriver\b/g, "driver license") // Handle "driver" → "driver license"
    .split(" ");
};