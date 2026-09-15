import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { getBrowseCandidates, getInterestUsage, type BrowseFilters } from "@/lib/matching";
import { educationLevelSchema, maritalStatusSchema, habitLevelSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!isProfileComplete(profile) || !profile?.seekingGender) {
    return NextResponse.json(
      { error: "Complete your profile before browsing.", code: "PROFILE_INCOMPLETE" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const filters: BrowseFilters = {};
  const city = searchParams.get("city");
  if (city) filters.city = city;
  const minAge = searchParams.get("minAge");
  if (minAge) filters.minAge = Number(minAge);
  const maxAge = searchParams.get("maxAge");
  if (maxAge) filters.maxAge = Number(maxAge);
  const educationLevel = educationLevelSchema.safeParse(searchParams.get("educationLevel"));
  if (educationLevel.success) filters.educationLevel = educationLevel.data;
  const maritalStatus = maritalStatusSchema.safeParse(searchParams.get("maritalStatus"));
  if (maritalStatus.success) filters.maritalStatus = maritalStatus.data;
  const hasChildren = searchParams.get("hasChildren");
  if (hasChildren === "true" || hasChildren === "false") filters.hasChildren = hasChildren === "true";
  const smoking = habitLevelSchema.safeParse(searchParams.get("smoking"));
  if (smoking.success) filters.smoking = smoking.data;
  const alcohol = habitLevelSchema.safeParse(searchParams.get("alcohol"));
  if (alcohol.success) filters.alcohol = alcohol.data;
  const aboutMe = searchParams.get("aboutMe");
  if (aboutMe) filters.aboutMe = aboutMe;
  const lookingFor = searchParams.get("lookingFor");
  if (lookingFor) filters.lookingFor = lookingFor;

  const [result, interestUsage] = await Promise.all([
    getBrowseCandidates(session.user.id, profile.seekingGender, filters, page),
    getInterestUsage(session.user.id),
  ]);
  return NextResponse.json({ ...result, interestUsage });
}
