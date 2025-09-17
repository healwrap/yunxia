interface GalaxyHeroContentProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  primaryButton?: {
    text: string;
    onClick?: () => void;
  };
  secondaryButton?: {
    text: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  };
  badge?: {
    text: string;
    icon?: React.ReactNode;
  };
  stats?: Array<{
    value: string;
    label: string;
  }>;
}

export function GalaxyHeroContent({
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  badge,
  stats,
}: GalaxyHeroContentProps) {
  return (
    <div className="text-left text-white pt-16 sm:pt-24 md:pt-32 px-4 max-w-4xl">
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs md:text-sm mb-6 md:mb-8">
          {badge.icon && badge.icon}
          {badge.text}
        </div>
      )}

      <div className="mb-6">
        {typeof title === 'string' ? (
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight tracking-wide">
            {title}
          </h1>
        ) : (
          title
        )}
      </div>

      {subtitle && (
        <div className="mb-6">
          {typeof subtitle === 'string' ? (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-300">
              {subtitle}
            </h2>
          ) : (
            subtitle
          )}
        </div>
      )}

      {description && (
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-80 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}

      {(primaryButton || secondaryButton) && (
        <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3 mb-8 sm:mb-12">
          {primaryButton && (
            <button
              onClick={primaryButton.onClick}
              className="bg-[#8200DB29] hover:bg-black/50 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 w-full sm:w-auto border border-[#322D36]"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              {primaryButton.text}
            </button>
          )}
          {secondaryButton && (
            <button
              onClick={secondaryButton.onClick}
              className="pointer-events-auto bg-[#0009] border border-gray-600 hover:border-gray-400 text-gray-200 hover:text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 flex items-center justify-center w-full sm:w-auto"
            >
              {secondaryButton.icon && secondaryButton.icon}
              {secondaryButton.text}
            </button>
          )}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl">
          {stats.map((stat, index) => (
            <div key={index} className="text-center md:text-left">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
