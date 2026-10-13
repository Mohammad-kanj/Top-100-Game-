import React from 'react';

export default function SynthwaveBackground() {
  return (
    <div className="synthwave-background">
      <div className="synthwave-horizon">
        <div className="synthwave-sun" />
      </div>
      <div className="synthwave-grid-plane" />
      {/* Subtle scanline overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)] pointer-events-none" />
    </div>
  );
}
