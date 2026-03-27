import { getMugProfile } from "@/lib/queries";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import MugProfileClient from "./MugProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return { title: "Mug Not Found" };

  const profile = await getMugProfile(id);
  if (!profile) return { title: "Mug Not Found" };

  return {
    title: `${profile.name} — MugLife`,
    description: `${profile.name} the ${profile.personality} lives on Floor ${profile.home_floor}. Scan to chat!`,
    openGraph: {
      title: `Meet ${profile.name} ☕`,
      description: `A ${profile.personality.toLowerCase()} mug from Floor ${profile.home_floor}. ${profile.days_away > 0 ? `Away from home for ${profile.days_away} days.` : "Currently at home!"}`,
    },
  };
}

export default async function MugPage({ params }: Props) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const profile = await getMugProfile(id);
  if (!profile) notFound();

  return <MugProfileClient initialProfile={profile} />;
}
