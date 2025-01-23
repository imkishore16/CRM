import React from 'react';

type SpotifyTrackPlayerProps = {
  trackUrl: string;
};

const SpotifyTrackPlayer: React.FC<SpotifyTrackPlayerProps> = ({ trackUrl }) => {
  return (
    <audio controls autoPlay>
      <source src={trackUrl} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
};

export default SpotifyTrackPlayer;
