export function CosmicGlow({ children }) {
  return (
    <div className="relative min-h-screen bg-canvas overflow-hidden flex flex-col">
      {/* 
        The cosmic glow layer. 
        Positioned at top-center, doesn't interfere with clicks.
        We apply it via CSS class from index.css to match the design system. 
      */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[image:var(--glow-cosmic)] bg-no-repeat bg-top" />
      
      {/* Content wrapper must be positioned relative to sit above the glow */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
