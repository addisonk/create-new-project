export function useDesignSystemSearchParams() {
  const params = { font: "geist", fontHeading: "geist", radius: "default", base: "radix", style: "luma", theme: "neutral", chartColor: "neutral" };
  const setParams = () => {};
  return [params, setParams] as const;
}
