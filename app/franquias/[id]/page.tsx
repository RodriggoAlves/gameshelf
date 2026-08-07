import FranchiseDetailClient from "./FranchiseDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return {
    title: `Franquia | Zerey`,
  };
}

export default async function FranchiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Use absolute URL for server side fetching
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  let data = null;
  try {
    const res = await fetch(`${baseUrl}/api/franchises/${id}`, { cache: 'no-store' });
    if (res.ok) {
      data = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch franchise details", error);
  }

  return <FranchiseDetailClient franchise={data?.error ? null : data} />;
}
