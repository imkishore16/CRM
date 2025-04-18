import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import initializePineConeDB from "@/lib/initializeIndex";


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to create a space" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const spaceName = searchParams.get("spaceName")

    
    if (!spaceName) {
      return NextResponse.json(
        { success: false, message: "Space name is required" },
        { status: 400 }
      );
    }
    console.log("spaceName :" , spaceName);
    const result = await prisma.$transaction(async (prismaClient) => {
      const space = await prismaClient.space.create({
        data: {
          name: spaceName,
          userId: session.user.id,
        },
      });
      
      const spaceId = space.id;
      const indexName = "campaign" + spaceId;
      
      try {
        await initializePineConeDB(indexName);
      } catch (pineconeError) {
        throw new Error(`Failed to initialize PineCone index: ${pineconeError}`);
      }
      
      return space;
    });
    
    return NextResponse.json(
      { success: true, message: "Space created successfully", space: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating space:", error);
    
    if (error.message === "Unauthenticated Request") {
      return NextResponse.json(
        { success: false, message: "You must be logged in to create a space" },
        { status: 401 }
      );
    }

    if (error.message.includes("Failed to initialize PineCone index")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Ensure the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to retrieve space information",
        },
        { status: 401 }
      );
    }

    const spaceId = req.nextUrl.searchParams.get("spaceId");

    // If a spaceId is provided, retrieve the hostId for the specific space
    if (spaceId) {
      const parsedSpaceId = parseInt(spaceId, 10); // Parse spaceId into an integer

      if (isNaN(parsedSpaceId)) {
        return NextResponse.json(
          { success: false, message: "Invalid Space ID" },
          { status: 400 }
        );
      }

      const space = await prisma.space.findUnique({
        where: { id: parsedSpaceId },
        select: { userId: true },
      });

      if (!space) {
        return NextResponse.json(
          { success: false, message: "Space not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Host ID retrieved successfully",
          hostId: space.userId,
        },
        { status: 200 }
      );
    }

    // If no spaceId is provided, retrieve all spaces for the user
    const spaces = await prisma.space.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Spaces retrieved successfully",
        spaces,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error retrieving space:", error);
    return NextResponse.json(
      { success: false, message: `Error retrieving space: ${error.message}` },
      { status: 500 }
    );
  }
}



export async function DELETE(req: NextRequest) {
  try {
    const spaceId = req.nextUrl.searchParams.get("spaceId");
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to delete a space" },
        { status: 401 }
      );
    }

    if (!spaceId) {
      return NextResponse.json(
        { success: false, message: "Space Id is required" },
        { status: 400 }
      );
    }

    const parsedSpaceId = parseInt(spaceId, 10); // Convert spaceId to an integer
    if (isNaN(parsedSpaceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Space Id" },
        { status: 400 }
      );
    }

    const space = await prisma.space.findUnique({
      where: { id: parsedSpaceId }, // Use the parsed integer
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Space not found" },
        { status: 404 }
      );
    }

    if (space.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to delete this space" },
        { status: 403 }
      );
    }

    await prisma.space.delete({
      where: { id: parsedSpaceId }, // Use the parsed integer
    });

    return NextResponse.json(
      { success: true, message: "Space deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting space:", error);
    return NextResponse.json(
      { success: false, message: `Error deleting space: ${error.message}` },
      { status: 500 }
    );
  }
}