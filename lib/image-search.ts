import "server-only";

// Looks up a stock/product photo for an identified piece of equipment, since
// most gear gets photographed for identification while still in its bag/case
// — that photo isn't a usable thumbnail, so this finds a proper one instead.
export async function findStockImage(equipmentName: string): Promise<string | null> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `${equipmentName} product photo`,
      numResults: 5,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const results: { image?: string }[] = data.results ?? [];
  const withImage = results.find((result) => typeof result.image === "string" && result.image.length > 0);
  return withImage?.image ?? null;
}
