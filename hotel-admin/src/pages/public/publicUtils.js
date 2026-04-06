import api from '../../services/api';

const apiRoot = (api.defaults.baseURL || '').replace(/\/api$/, '');

export const formatCurrency = (value) => (
  Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
);

export const getRoomImageUrl = (room) => {
  const firstImage = Array.isArray(room?.images) && room.images.length > 0 ? room.images[0] : null;
  if (firstImage) return `${apiRoot}/uploads/rooms/${firstImage}`;
  if (room?.imageUrl) return room.imageUrl;
  return null;
};

export const getRoomImageUrls = (room) => {
  const images = Array.isArray(room?.images) ? room.images : [];
  return images.map((filename) => `${apiRoot}/uploads/rooms/${filename}`);
};

export const getHallImageUrl = (hall) => {
  const firstImage = Array.isArray(hall?.images) && hall.images.length > 0 ? hall.images[0] : null;
  if (firstImage) return `${apiRoot}/uploads/halls/${firstImage}`;
  return null;
};

export const getHallImageUrls = (hall) => {
  const images = Array.isArray(hall?.images) ? hall.images : [];
  return images.map((filename) => `${apiRoot}/uploads/halls/${filename}`);
};

export const getShortText = (text, max = 110) => {
  if (!text) return 'Découvrez un espace pensé pour votre confort, votre repos et votre bien-être.';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

export const calcNightCount = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (isNaN(checkIn) || isNaN(checkOut) || checkOut <= checkIn) return 0;
  return Math.round((checkOut - checkIn) / (24 * 60 * 60 * 1000));
};

export const calcInclusiveDayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
};