import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UrlScrapingService } from "@/lib/services/UrlScrapingService";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          error: "URL is required",
          errorType: "validation",
          suggestion: "Please paste a valid product URL",
          canRetry: false,
        },
        { status: 400 }
      );
    }

    const result = await UrlScrapingService.getInstance().scrapeUrl(url);

    // Check if result is an error
    if ("error" in result) {
      return NextResponse.json(result, { status: result.canRetry ? 400 : 200 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in scrape-url API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        errorType: "unknown",
        suggestion: "Please try again or copy the product details manually.",
        canRetry: true,
      },
      { status: 500 }
    );
  }
}
