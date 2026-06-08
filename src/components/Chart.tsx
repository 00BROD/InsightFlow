import { useEffect, useRef } from 'react';
import embed, { type Result } from 'vega-embed';

export function Chart({ spec, onView }: { spec: object; onView?: (r: Result) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let result: Result | undefined;
    embed(ref.current, spec as any, { actions: false, renderer: 'svg' }).then((r) => {
      result = r;
      onView?.(r);
    });
    return () => result?.finalize();
  }, [spec, onView]);
  return <div ref={ref} className="w-full" />;
}
