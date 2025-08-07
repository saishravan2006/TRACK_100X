import { useState } from 'react';
import { Check, Crown, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 10 students',
      'Basic scheduling',
      'Payment tracking',
      'Basic analytics',
      'Mobile app access',
    ],
    limitations: [
      'Limited to 10 students',
      'Basic support only',
      'No advanced features',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '₹999',
    period: 'per month',
    description: 'For growing teaching businesses',
    features: [
      'Unlimited students',
      'Advanced scheduling',
      'Payment tracking & analytics',
      'Automated reminders',
      'Priority support',
      'Custom branding',
      'Export capabilities',
      'Advanced reporting',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,999',
    period: 'per month',
    description: 'For established teaching institutions',
    features: [
      'Everything in Professional',
      'Multi-location support',
      'Team collaboration',
      'API access',
      'White-label solution',
      'Dedicated account manager',
      'Advanced integrations',
      'Custom features',
    ],
  },
];

export default function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would integrate with a payment processor
    alert(`Upgrading to ${plans.find(p => p.id === planId)?.name} plan! (Demo only)`);
    setLoading(false);
    onOpenChange(false);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 pb-6">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Upgrade Your Teaching Experience
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited potential with our premium plans. Choose the perfect plan to grow your teaching business.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-purple-500 shadow-xl scale-105'
                  : 'hover:shadow-lg'
              } ${plan.popular ? 'border-purple-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 right-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className={`text-center pb-4 ${plan.popular ? 'bg-gradient-to-br from-purple-50 to-blue-50' : ''}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  plan.id === 'free' 
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200' 
                    : plan.id === 'pro'
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                }`}>
                  {plan.id === 'free' ? (
                    <Zap className="h-8 w-8 text-gray-600" />
                  ) : plan.id === 'pro' ? (
                    <Crown className="h-8 w-8 text-white" />
                  ) : (
                    <Crown className="h-8 w-8 text-white" />
                  )}
                </div>
                
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-lg font-normal text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, index) => (
                    <li key={index} className="flex items-center space-x-3 opacity-60">
                      <div className="flex-shrink-0">
                        <X className="h-5 w-5 text-red-400" />
                      </div>
                      <span className="text-gray-600 text-sm line-through">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {!plan.current && (
                  <Button
                    className={`w-full mt-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                        : plan.id === 'premium'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-purple-800">
              🎉 Special Launch Offer
            </h3>
            <p className="text-purple-700">
              Get 30% off your first 3 months when you upgrade today! 
              <br />
              <span className="text-sm">Use code: <strong>TRACK30</strong></span>
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-purple-600">
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ Cancel anytime</span>
              <span>✓ Instant activation</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}