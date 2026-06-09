/**
 * Reusable Skeleton Loader Components
 * 
 * Purpose: Eliminates "blank screen" flash during data fetching.
 * Provides layout-aware placeholders that match the shape of actual content.
 * 
 * Usage:
 *   <SkeletonLoader type="table" rows={5} />
 *   <SkeletonLoader type="card" count={3} />
 *   <SkeletonLoader type="profile" />
 *   <SkeletonLoader type="text" lines={4} />
 */


// ─── Base shimmer animation ────────────────────────────────────────────────────
const shimmerStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '4px',
};

const globalStyles = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// Inject global shimmer animation once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

// ─── Individual skeleton elements ─────────────────────────────────────────────

function SkeletonBox({ width = '100%', height = '16px', style = {} }) {
  return (
    <div style={{ width, height, ...shimmerStyle, ...style }} aria-hidden="true" />
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────
function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={`${100 / cols}%`} height="14px" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} style={{
          display: 'flex', gap: '16px', padding: '14px 16px',
          borderBottom: '1px solid #f1f5f9',
          background: rowIdx % 2 === 0 ? '#fff' : '#fafafa'
        }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBox key={colIdx} width={`${100 / cols}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────
function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          flex: '1 1 280px', maxWidth: '320px',
          padding: '20px', borderRadius: '12px',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SkeletonBox width="48px" height="48px" style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBox width="60%" height="14px" />
              <SkeletonBox width="40%" height="12px" />
            </div>
          </div>
          <SkeletonBox height="12px" />
          <SkeletonBox height="12px" width="80%" />
          <SkeletonBox height="12px" width="60%" />
          <SkeletonBox height="36px" style={{ borderRadius: '8px', marginTop: '4px' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Profile Skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <SkeletonBox width="96px" height="96px" style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SkeletonBox width="50%" height="20px" />
          <SkeletonBox width="35%" height="14px" />
          <SkeletonBox width="45%" height="14px" />
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="120px" height="12px" />
          <SkeletonBox height="40px" style={{ borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Text Lines Skeleton ──────────────────────────────────────────────────────
function TextSkeleton({ lines = 3 }) {
  const widths = ['100%', '85%', '92%', '75%', '88%', '70%'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} width={widths[i % widths.length]} height="14px" />
      ))}
    </div>
  );
}

// ─── Dashboard Stats Skeleton ─────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            flex: '1 1 180px',
            padding: '20px',
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <SkeletonBox width="40px" height="40px" style={{ borderRadius: '8px' }} />
            <SkeletonBox width="60%" height="24px" />
            <SkeletonBox width="80%" height="12px" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <SkeletonBox height="280px" style={{ borderRadius: '12px' }} />
      {/* Table */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}

// ─── Notification Skeleton ────────────────────────────────────────────────────
function NotificationSkeleton({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', gap: '12px', padding: '14px 16px',
          background: '#fff', borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <SkeletonBox width="36px" height="36px" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonBox width="70%" height="14px" />
            <SkeletonBox width="50%" height="12px" />
          </div>
          <SkeletonBox width="60px" height="12px" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Export: polymorphic SkeletonLoader ───────────────────────────────────
function SkeletonLoader({ type = 'text', ...props }) {
  const loaders = {
    table:        <TableSkeleton {...props} />,
    card:         <CardSkeleton {...props} />,
    profile:      <ProfileSkeleton />,
    text:         <TextSkeleton {...props} />,
    dashboard:    <DashboardSkeleton />,
    notification: <NotificationSkeleton {...props} />,
  };

  return loaders[type] || <TextSkeleton {...props} />;
}

export default SkeletonLoader;
export { SkeletonBox, TableSkeleton, CardSkeleton, ProfileSkeleton, TextSkeleton, DashboardSkeleton, NotificationSkeleton };
