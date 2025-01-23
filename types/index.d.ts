interface Video {
  id: string;
  platform:string;
  type: string;       // Could be video type (e.g., "YouTube", "Vimeo")
  url: string;        // URL to the video resource
  extractedId: string; // ID extracted from the video provider
  title: string;      // Title of the video
  smallImg: string;   // URL for a small thumbnail image
  bigImg: string;     // URL for a larger image or thumbnail
  active: boolean;    // Whether the video is active or not
  userId: string;     // ID of the user who uploaded or added the video
  upvotes: number;    // Number of upvotes for the video
  haveUpvoted: boolean; // Whether the current user has upvoted the video
  spaceId: string;    // The ID of the space this video belongs to (e.g., group, category)

  // Optional properties for future extension
  description?: string;  // Optional description or summary for the video
  createdAt?: Date;      // Optional timestamp for when the video was added
  updatedAt?: Date;      // Optional timestamp for when the video was last updated
  duration?: number;     // Optional video duration in seconds
  tags?: string[];       // Optional array of tags for categorization
  isFeatured?: boolean;  // Optional flag to highlight the video as featured
}
