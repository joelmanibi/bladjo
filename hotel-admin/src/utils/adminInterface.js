import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuth, isSupervisorOnlyUser } from './auth';

export const ADMIN_INTERFACES = {
  HOTEL: 'HOTEL',
  RENTAL: 'RENTAL',
};

const STORAGE_KEY = 'adminInterface';
const CHANGE_EVENT = 'admin-interface-change';

const ROUTE_GROUPS = {
  GLOBAL: ['/dashboard', '/users'],
  HOTEL: ['/rooms', '/halls', '/reservations', '/hall-bookings', '/stock', '/commandes', '/employees'],
  RENTAL: ['/immeubles', '/appartements', '/locataires', '/loyers', '/paiements'],
};

export function getRouteGroup(pathname) {
  if (!pathname) return 'GLOBAL';

  if (ROUTE_GROUPS.GLOBAL.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return 'GLOBAL';
  }
  if (ROUTE_GROUPS.HOTEL.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return ADMIN_INTERFACES.HOTEL;
  }
  if (ROUTE_GROUPS.RENTAL.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return ADMIN_INTERFACES.RENTAL;
  }

  return 'GLOBAL';
}

export function getAvailableAdminInterfaces(role, backendRole) {
  if (isSupervisorOnlyUser(backendRole)) {
    return [ADMIN_INTERFACES.HOTEL, ADMIN_INTERFACES.RENTAL];
  }
  if (role === 'RECEPTION') {
    return [ADMIN_INTERFACES.HOTEL];
  }
  if (role === 'SUPER_ADMIN' || role === 'GERANT') {
    return [ADMIN_INTERFACES.HOTEL, ADMIN_INTERFACES.RENTAL];
  }

  return [ADMIN_INTERFACES.HOTEL];
}

export function getStoredAdminInterface() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredAdminInterface(nextInterface) {
  localStorage.setItem(STORAGE_KEY, nextInterface);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resolveAdminInterface(pathname, role, backendRole) {
  const availableInterfaces = getAvailableAdminInterfaces(role, backendRole);
  const routeGroup = getRouteGroup(pathname);

  if (availableInterfaces.includes(routeGroup)) {
    return routeGroup;
  }

  const storedInterface = getStoredAdminInterface();
  if (availableInterfaces.includes(storedInterface)) {
    return storedInterface;
  }

  return availableInterfaces[0] || ADMIN_INTERFACES.HOTEL;
}

export function isRouteVisibleInInterface(pathname, currentInterface) {
  const routeGroup = getRouteGroup(pathname);
  return routeGroup === 'GLOBAL' || routeGroup === currentInterface;
}

export function getInterfaceMeta(currentInterface) {
  return currentInterface === ADMIN_INTERFACES.RENTAL
    ? {
        label: 'Immobilier locatif',
        icon: '🏢',
        accent: '#0f766e',
        accentSoft: '#ccfbf1',
        accentMuted: '#ecfeff',
        accentText: '#115e59',
        heroGradient: 'linear-gradient(135deg, #0f172a 0%, #0f766e 55%, #14b8a6 100%)',
      }
    : {
        label: 'Hôtel',
        icon: '🏨',
        accent: '#2563eb',
        accentSoft: '#dbeafe',
        accentMuted: '#eff6ff',
        accentText: '#1d4ed8',
        heroGradient: 'linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #60a5fa 100%)',
      };
}

export function useAdminInterface() {
  const location = useLocation();
  const { role, backendRole } = getAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const notify = () => setVersion((value) => value + 1);
    window.addEventListener('storage', notify);
    window.addEventListener(CHANGE_EVENT, notify);
    return () => {
      window.removeEventListener('storage', notify);
      window.removeEventListener(CHANGE_EVENT, notify);
    };
  }, []);

  const availableInterfaces = useMemo(
    () => getAvailableAdminInterfaces(role, backendRole),
    [role, backendRole, version]
  );

  const currentInterface = useMemo(
    () => resolveAdminInterface(location.pathname, role, backendRole),
    [location.pathname, role, backendRole, version]
  );

  return {
    currentInterface,
    availableInterfaces,
    routeGroup: getRouteGroup(location.pathname),
    setCurrentInterface: setStoredAdminInterface,
  };
}