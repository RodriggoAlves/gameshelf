import { NextResponse } from "next/server";
import { getUser } from "../../../app/actions/auth";
import { getFeaturedContent } from "../../../app/actions/admin";

export async function GET() {
  try {
    const user = await getUser();
    const hero = await getFeaturedContent('HOME_HERO');
    return NextResponse.json({ success: true, user, hero });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
