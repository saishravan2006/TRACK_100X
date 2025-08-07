import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, GraduationCap, Music, Dumbbell, Palette, Code, BookOpen, Heart, Users, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const services = [
  { id: 'academic', name: 'Academic Tutoring', icon: GraduationCap, color: 'from-blue-500 to-blue-600' },
  { id: 'music', name: 'Music Lessons', icon: Music, color: 'from-purple-500 to-purple-600' },
  { id: 'fitness', name: 'Fitness Training', icon: Dumbbell, color: 'from-green-500 to-green-600' },
  { id: 'art', name: 'Art & Design', icon: Palette, color: 'from-pink-500 to-pink-600' },
  { id: 'coding', name: 'Programming', icon: Code, color: 'from-orange-500 to-orange-600' },
  { id: 'language', name: 'Language Classes', icon: BookOpen, color: 'from-indigo-500 to-indigo-600' },
  { id: 'wellness', name: 'Health & Wellness', icon: Heart, color: 'from-red-500 to-red-600' },
  { id: 'group', name: 'Group Activities', icon: Users, color: 'from-teal-500 to-teal-600' },
  { id: 'business', name: 'Business Coaching', icon: Briefcase, color: 'from-gray-700 to-gray-800' },
];

export default function Onboarding() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedService) {
      setError('Please select a service type to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Authentication required. Please sign in again.');
        navigate('/auth');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          service_type: selectedService,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Welcome to Track 10X!",
        description: "Your profile has been set up successfully.",
      });

      navigate('/');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-2xl backdrop-blur-sm bg-white/95 shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent">
            Welcome to Track 10X!
          </CardTitle>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Let's get started by telling us what kind of service you offer. This helps us customize your experience.
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">What type of service do you offer?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const IconComponent = service.icon;
                const isSelected = selectedService === service.id;
                
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:scale-[1.02] ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-center">
                        <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {service.name}
                        </h4>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {selectedServiceData && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${selectedServiceData.color} flex items-center justify-center`}>
                    <selectedServiceData.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-800 font-medium">Selected: {selectedServiceData.name}</p>
                    <p className="text-blue-600 text-sm">Perfect! We'll customize your dashboard for this service.</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleContinue}
              disabled={!selectedService || loading}
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Setting up your account...' : 'Continue to Dashboard'}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don't worry, you can always change this later in your profile settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}