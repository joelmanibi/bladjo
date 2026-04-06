import Sidebar from './Sidebar';
import Topbar  from './Topbar';

export default function AdminLayout({ children, title }) {
  return (
    <div style={styles.shell}>
      {/* Left — fixed sidebar */}
      <Sidebar />

      {/* Right — topbar + scrollable content */}
      <div style={styles.main}>
        <Topbar title={title} />
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#f0f2f5',
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
};

