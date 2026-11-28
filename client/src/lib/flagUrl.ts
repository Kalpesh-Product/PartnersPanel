// Flag emoji don't reliably render on Windows — use real flag images instead.
export const flagUrl = (isoCode: string) => `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
