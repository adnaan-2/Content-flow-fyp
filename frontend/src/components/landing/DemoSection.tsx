import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Image as ImageIcon,
  Play,
  CheckCircle,
  Sparkles
} from "lucide-react";

const DemoCard = ({ 
  icon, 
  title, 
  description, 
  isActive, 
  onClick 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div 
    className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-2 border-purple-500' 
        : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isActive ? 'bg-purple-500' : 'bg-gray-700'
      }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white ml-3">{title}</h3>
    </div>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const DemoSection = () => {
  const [activeDemo, setActiveDemo] = useState('ai-content');

  const demoFeatures = {
    'ai-content': {
      title: 'AI Content Generation',
      content: (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-purple-400 mr-2" />
            <span className="text-purple-400 font-semibold">AI Content Creator</span>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-2">Input:</div>
              <div className="text-white">"Create a post about healthy morning routines"</div>
            </div>
            <div className="flex justify-center">
              <div className="animate-pulse">
                <Wand2 className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30">
              <div className="text-gray-400 text-sm mb-2">AI Generated:</div>
              <div className="text-white mb-3">
                "🌅 Start your day right! Here's my proven 5-step morning routine that changed everything..."
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Badge className="bg-green-500/20 text-green-400">High Engagement Predicted</Badge>
                  <Badge className="bg-blue-500/20 text-blue-400">Optimal Length</Badge>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    'scheduling': {
      title: 'Smart Scheduling',
      content: (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-blue-400 font-semibold">Content Calendar</span>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-gray-400 text-sm font-semibold py-2">
                {day}
              </div>
            ))}
            {Array.from({length: 14}, (_, i) => (
              <div key={i} className={`h-10 rounded border text-center flex items-center justify-center text-sm ${
                i === 5 || i === 8 || i === 12 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
            <div className="text-purple-400 font-semibold mb-1">Today's Schedule</div>
            <div className="text-gray-300 text-sm">
              • 9:00 AM - Instagram Story (Peak Activity) 📈<br/>
              • 2:00 PM - LinkedIn Post (Professional Hours) 💼<br/>
              • 7:00 PM - Twitter Thread (Evening Engagement) 🐦
            </div>
          </div>
        </div>
      )
    },
    'analytics': {
      title: 'Performance Analytics',
      content: (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">Analytics Dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">+847%</div>
              <div className="text-gray-400 text-sm">Reach Growth</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">3.2M</div>
              <div className="text-gray-400 text-sm">Total Impressions</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-400">94%</div>
              <div className="text-gray-400 text-sm">Engagement Rate</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 p-3 rounded-lg border border-green-500/30">
            <div className="text-green-400 font-semibold mb-1">🚀 Viral Alert!</div>
            <div className="text-gray-300 text-sm">
              Your "Morning Routine" post is trending! 10x more engagement than usual.
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Play className="h-4 w-4 mr-2" />
            See It In Action
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Watch Your Content <span className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Go Viral</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the power of AI-driven social media management. See how our tools turn ordinary posts into viral sensations.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Demo Controls */}
          <div className="space-y-4">
            <DemoCard
              icon={<Wand2 className="h-5 w-5 text-white" />}
              title="AI Content Generation"
              description="Transform ideas into viral-ready posts with our AI"
              isActive={activeDemo === 'ai-content'}
              onClick={() => setActiveDemo('ai-content')}
            />
            <DemoCard
              icon={<Calendar className="h-5 w-5 text-white" />}
              title="Smart Scheduling"
              description="Post at perfect times when your audience is most active"
              isActive={activeDemo === 'scheduling'}
              onClick={() => setActiveDemo('scheduling')}
            />
            <DemoCard
              icon={<BarChart3 className="h-5 w-5 text-white" />}
              title="Performance Analytics"
              description="Track your viral moments and optimize for growth"
              isActive={activeDemo === 'analytics'}
              onClick={() => setActiveDemo('analytics')}
            />
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-2">
            {demoFeatures[activeDemo as keyof typeof demoFeatures].content}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 text-lg">
            Try It Free - No Credit Card Required
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;