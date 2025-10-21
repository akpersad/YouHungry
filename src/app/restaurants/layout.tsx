import { getRestaurantsMetadata } from '@/lib/metadata';

export const metadata = getRestaurantsMetadata();

export default function RestaurantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
