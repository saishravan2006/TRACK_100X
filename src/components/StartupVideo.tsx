import React, { useState, useRef, useEffect } from 'react';
// Use video from public directory
const introVideo = '/intro-video.mp4';
import logoImage from '../assets/images/Untitled design (1).svg';

interface StartupVideoProps {
  onVideoEnd: () => void;
}

const StartupVideo: React.FC<StartupVideoProps> = ({ onVideoEnd }) => {
  const [showVideo, setShowVideo] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented or interrupted
          console.log('Video autoplay prevented:', error);
          // If autoplay fails, show transition after 3 seconds
          setTimeout(() => {
            if (showVideo) {
              handleVideoEnd();
            }
          }, 3000);
        });
      }
    }
  }, [videoLoaded]);

  const handleVideoEnd = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setShowVideo(false);
    setShowTransition(true);
    
    // Show transition screen for 2 seconds before moving to login
    setTimeout(() => {
      onVideoEnd();
    }, 2000);
  };

  const handleVideoClick = () => {
    // Allow users to skip the video by clicking
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    handleVideoEnd();
  };

  if (showTransition) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-start pt-16 z-50">
        <div className="transform hover:scale-105 transition-transform duration-300">
          <img 
            src={logoImage} 
            alt="Track 10X Logo" 
            className="h-20 w-20 mb-8"
          />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent">
            Track 10X
          </h1>
          <p className="text-gray-600 text-xl">Accelerate your teaching success</p>
        </div>
        <div className="absolute bottom-8 text-center">
          <div className="animate-pulse text-gray-400 text-sm">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (showVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <video
          ref={videoRef}
          className="w-full h-full object-cover cursor-pointer"
          onEnded={handleVideoEnd}
          onClick={handleVideoClick}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => {
            setVideoError(true);
            // If video fails to load, skip to transition after 2 seconds
            setTimeout(() => {
              handleVideoEnd();
            }, 2000);
          }}
          muted
          playsInline
          preload="auto"
        >
          <source src={introVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 bg-black">
          </div>
        )}
        {videoError && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-xl text-center">
              <div className="mb-4">⚠️</div>
              <div>Video could not be loaded</div>
              <div className="text-sm mt-2 opacity-70">Continuing to app...</div>
            </div>
          </div>
        )}
        <div className="absolute bottom-8 right-8 text-white text-sm opacity-70">
          Click to skip
        </div>
      </div>
    );
  }

  return null;
};

export default StartupVideo;