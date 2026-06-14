import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import { useResponsive } from '../utils/useResponsive';

export default function AdminLayout({ children, title }) {
  const { isMobile, isTablet } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div style={styles.shell}>
      {/* Left — fixed sidebar */}
      <Sidebar
        mobile={isMobile}
        open={isMobile ? sidebarOpen : true}
        compact={isTablet}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Right — topbar + scrollable content */}
      <div style={styles.main}>
        <Topbar
          title={title}
          isMobile={isMobile}
          isTablet={isTablet}
          onToggleSidebar={isMobile ? () => setSidebarOpen((value) => !value) : undefined}
        />
        <div style={{ ...styles.content, ...(isMobile ? styles.contentMobile : isTablet ? styles.contentTablet : {}) }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
  },
  contentTablet: {
    padding: '24px',
  },
  contentMobile: {
    padding: '16px',
  },
};

