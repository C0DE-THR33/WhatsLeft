/**
 * SVG stroke-dasharray/dashoffset for a donut chart's segments, given each
 * slice's share of the whole as a percentage. Same technique as the design
 * canvas (design/Home.dc.html, Analytics.dc.html), just computed from real
 * percentages instead of hand-typed per screen.
 */
export interface DonutSegment {
  dasharray: string;
  dashoffset: string;
}

export function donutSegments(percentages: number[], radius = 40): DonutSegment[] {
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return percentages.map((pct) => {
    const len = (pct / 100) * circumference;
    const segment: DonutSegment = {
      dasharray: `${len.toFixed(2)} ${circumference.toFixed(2)}`,
      dashoffset: `${(-offset).toFixed(2)}`,
    };
    offset += len;
    return segment;
  });
}
