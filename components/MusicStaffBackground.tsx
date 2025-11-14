export function MusicStaffBackground() {
  return (
    <>
      {/* Music Staff Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="relative"
            style={{
              marginTop: groupIndex === 0 ? '80px' : '60px',
            }}
          >
            {/* Five staff lines per group */}
            {[...Array(5)].map((_, lineIndex) => (
              <div
                key={lineIndex}
                className="w-full h-[1.5px] bg-[#8b7355]/25"
                style={{
                  marginTop: lineIndex === 0 ? '0' : '14px',
                  boxShadow: '0 0.5px 0 rgba(139, 115, 85, 0.08)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

