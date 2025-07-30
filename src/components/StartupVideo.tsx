import { useState, useEffect, useRef } from 'react';
import logoImage from '../assets/images/Untitled design (1).svg';

// Use video from public directory
// Note: Replace with a web-compatible MP4 video file
const introVideo = '/video.mp4';

interface StartupVideoProps {
  onVideoEnd: () => void;
}

const StartupVideo: React.FC<StartupVideoProps> = ({ onVideoEnd }) => {
  const [showVideo, setShowVideo] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    // Always try to start audio first
    if (audio) {
      audio.play().then(() => {
        console.log('Audio started playing successfully');
      }).catch(error => {
        console.log('Audio autoplay prevented:', error);
      });
    }
    
    if (video) {
      console.log('Video element found, src:', video.src);
      
      // Add load event listener
      const handleLoad = () => {
        console.log('Video loaded successfully');
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video started playing successfully');
          }).catch(error => {
            console.log('Video autoplay prevented:', error);
            setTimeout(() => {
              if (showVideo) {
                handleVideoEnd();
              }
            }, 5000);
          });
        }
      };
      
      const handleLoadError = (e) => {
        console.error('Video load error:', e);
        console.log('Video file may not be web-compatible. Please ensure the video is encoded for web playback.');
        setHasError(true);
        
        // Still try to play audio even if video fails
        const audio = audioRef.current;
        if (audio) {
          audio.play().then(() => {
            console.log('Audio started playing (video failed)');
          }).catch(error => {
            console.log('Audio autoplay also prevented:', error);
          });
        }
        
        setTimeout(() => {
          handleVideoEnd();
        }, 3000); // Give more time for audio to play
      };
      
      video.addEventListener('loadeddata', handleLoad);
      video.addEventListener('error', handleLoadError);
      
      // Force load
      video.load();
      
      return () => {
        video.removeEventListener('loadeddata', handleLoad);
        video.removeEventListener('error', handleLoadError);
      };
    }
  }, [showVideo]);

  const handleVideoEnd = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (video) {
      video.pause();
    }
    if (audio) {
      audio.pause();
    }
    
    setShowVideo(false);
    setIsTransitioning(true);
    
    // Show transition screen for 2 seconds before moving to login
    setTimeout(() => {
      onVideoEnd();
    }, 2000);
  };



  if (isTransitioning) {
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
          src={introVideo}
          className="w-full h-full object-cover"
          onEnded={handleVideoEnd}
          onError={() => {
            setHasError(true);
            // If video fails to load, still try to play audio
            const audio = audioRef.current;
            if (audio) {
              audio.play().then(() => {
                console.log('Audio started playing (video error)');
              }).catch(error => {
                console.log('Audio autoplay prevented:', error);
              });
            }
            // Skip to transition after 3 seconds to allow audio to play
            setTimeout(() => {
              handleVideoEnd();
            }, 3000);
          }}
          autoPlay
          playsInline
          preload="auto"
        >
          Your browser does not support the video tag.
        </video>
        <audio
          ref={audioRef}
          src="/video (1).mp3"
          preload="auto"
          onError={(e) => {
            console.log('Audio failed to load:', e);
          }}
        />
        {hasError && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-xl text-center">
              <div className="mb-4">🎵</div>
              <div>Playing startup audio</div>
              <div className="text-sm mt-2 opacity-70">Continuing to app...</div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default StartupVideo;