export function PlaceholderImage({ width = 100, height = 100, className = "" }) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="#1c1816" />
        <rect x="20%" y="20%" width="60%" height="60%" fill="#c70007" opacity="0.3" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#ffffff"
          fontSize={width > 100 ? "16" : "10"}
        >
          No Image
        </text>
      </svg>
    )
  }
  