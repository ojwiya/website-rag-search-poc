import { NextResponse } from 'next/server';
import { getCountryGuide, listGuideCountries } from '@/lib/guides';

/** Buyer-agent `get_country_guide` contract. */
export async function GET(
  _request: Request,
  context: { params: { country: string } }
) {
  const country = context.params.country;
  const guide = getCountryGuide(country);

  if (!guide) {
    return NextResponse.json(
      {
        error: 'Guide not found',
        available: listGuideCountries(),
      },
      { status: 404 }
    );
  }

  return NextResponse.json(guide);
}
