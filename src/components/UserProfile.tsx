import { useState, useEffect } from 'react';
import { LogOut, User, Settings, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  name: string;
  email: string;
  service_type: string | null;
  subscription_tier: string;
}

interface UserProfileProps {
  onOpenSubscription?: () => void;
}

export default function UserProfile({ onOpenSubscription }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, service_type, subscription_tier')
        .eq('user_id', user.id)
        .single();

      setProfile({
        name: profileData?.name || 'User',
        email: user.email || '',
        service_type: profileData?.service_type || null,
        subscription_tier: profileData?.subscription_tier || 'free'
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-2 bg-white shadow-lg rounded-full animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isPremium = profile.subscription_tier !== 'free';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 rounded-full hover:bg-gray-100">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-0">
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                  {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                <p className="text-sm text-gray-600">{profile.email}</p>
                {profile.service_type && (
                  <p className="text-xs text-blue-600 capitalize">{profile.service_type.replace('_', ' ')}</p>
                )}
              </div>
            </div>

            {!isPremium && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Upgrade to Premium</p>
                    <p className="text-xs text-purple-600">Unlimited students & more</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs px-3 py-1 h-auto"
                    onClick={onOpenSubscription}
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer p-3">
          <User className="h-4 w-4 mr-3" />
          Profile Settings
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer p-3">
          <Settings className="h-4 w-4 mr-3" />
          App Settings
        </DropdownMenuItem>

        {!isPremium && (
          <DropdownMenuItem className="cursor-pointer p-3" onClick={onOpenSubscription}>
            <Crown className="h-4 w-4 mr-3 text-yellow-500" />
            Upgrade Plan
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          className="cursor-pointer p-3 text-red-600 focus:text-red-600 focus:bg-red-50" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}