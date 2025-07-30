import React, { useState, useEffect, useRef } from 'react';
import logoImage from '../assets/images/Untitled design (1).svg';

// Use video from public directory
const introVideo = '/video.mp4';

interface StartupVideoProps {
  onVideoEnd: () => void;
}

const StartupVideo: React.FC<StartupVideoProps> = ({ onVideoEnd }) => {
  const [showVideo, setShowVideo] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Small delay to ensure video is ready
      setTimeout(() => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video started playing successfully');
          }).catch(error => {
            // Auto-play was prevented or interrupted
            console.log('Video autoplay prevented:', error);
            // If autoplay fails, show transition after 5 seconds
            setTimeout(() => {
              if (showVideo) {
                handleVideoEnd();
              }
            }, 5000);
          });
        }
      }, 100);
    }
  }, [showVideo]);

  const handleVideoEnd = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setShowVideo(false);
    setIsTransitioning(true);
    
    // Show transition screen for 2 seconds before moving to login
    setTimeout(() => {
      onVideoEnd();
    }, 2000);
  };

  // Auto-skip after video duration or on error
  useEffect(() => {
    // Fallback timer in case video doesn't end naturally
    const fallbackTimer = setTimeout(() => {
      if (showVideo) {
        handleVideoEnd();
      }
    }, 10000); // 10 seconds max

    return () => clearTimeout(fallbackTimer);
  }, [showVideo]);

  if (isTransitioning) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="animate-pulse">
          <img 
            src={logoImage} 
            alt="Track 10X Logo" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <div className="text-black text-center">
            <h1 className="text-2xl font-bold mb-2">Track 10X</h1>
            <p className="text-sm opacity-80">Accelerate your teaching success</p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-black text-xs opacity-60 animate-pulse">
          Starting your journey...
        </div>
      </div>
    );
  }

  if (showVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50" onClick={() => handleVideoEnd()}>
        <video
          ref={videoRef}
          src={introVideo}
          className="w-full h-full object-cover"
          onEnded={handleVideoEnd}
          onError={() => {
            setHasError(true);
            // If video fails to load, skip to transition after 2 seconds
            setTimeout(() => {
              handleVideoEnd();
            }, 2000);
          }}
          muted
          autoPlay
          playsInline
          preload="auto"
          style={{
            pointerEvents: 'none'
          }}
        >
          Your browser does not support the video tag.
        </video>
        {hasError && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-xl text-center">
              <div className="mb-4">⚠️</div>
              <div>Video could not be loaded</div>
              <div className="text-sm mt-2 opacity-70">Continuing to app...</div>
            </div>
          </div>
        )}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60">
          Tap anywhere to skip
        </div>
      </div>
    );
  }

  return null;
};

export default StartupVideo;