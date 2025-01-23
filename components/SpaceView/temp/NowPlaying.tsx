import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import YouTube from 'react-youtube';
import Image from "next/image";

type Props = {
  playVideo: boolean;
  currentVideo: Video | null;
  playNextLoader: boolean;
  playNext: () => void;
};

export default function NowPlaying({ playVideo, currentVideo, playNext, playNextLoader }: Props) {
  const youtubeOptions = {
    height: '100%', 
    width: '100%', 
    playerVars: {
      autoplay: 1 as 1, 
    },
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 0) {
      playNext();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Now Playing</h2>
      <Card>
        <CardContent className="p-4">
          {currentVideo ? (
            <div>
              {playVideo ? (
                <>
                  {currentVideo.platform === "YOUTUBE" ? (
                    // YouTube player using react-youtube
                    <div className="w-full h-[390px]">
                      <YouTube
                        videoId={currentVideo.extractedId}
                        opts={youtubeOptions}
                        onStateChange={onPlayerStateChange}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    // Spotify player with autoplay
                    <iframe
                      src={`https://open.spotify.com/embed/track/${currentVideo.extractedId}?autoplay=1`} // Enable autoplay
                      width="100%"
                      height="380"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      title="Spotify Player"
                    ></iframe>
                  )}
                </>
              ) : (
                <>
                  <Image
                    height={288}
                    width={288}
                    alt={currentVideo.title}
                    src={currentVideo.bigImg}
                    className="h-72 w-full rounded object-cover"
                  />
                  <p className="mt-2 text-center font-semibold">{currentVideo.title}</p>
                </>
              )}
            </div>
          ) : (
            <p className="py-8 text-center">No media playing</p>
          )}
        </CardContent>
      </Card>
      {playVideo && (
        <Button disabled={playNextLoader} onClick={playNext} className="w-full">
          <Play className="mr-2 h-4 w-4" />
          {playNextLoader ? "Loading..." : "Play next"}
        </Button>
      )}
    </div>
  );
}
