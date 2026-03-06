import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  HelpCircle,
  Video,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Search,
  PlayCircle,
  FileText,
  Zap,
  LifeBuoy,
  Users
} from 'lucide-react';
import { ToolPageLayout } from '../components/ToolPageLayout';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  url: string;
}

interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'How do I get started with AMZBoosted?',
    answer: 'Start by selecting a tool from the sidebar. Use the "Quick Use" tab for instant analysis by pasting product URLs, or automate tasks via the Schedules page.',
    category: 'Getting Started',
  },
  {
    question: 'What marketplaces are supported?',
    answer: 'We support 8 major Amazon marketplaces including US (.com), UK (.co.uk), Canada (.ca), India (.in), Germany (.de), France (.fr), Italy (.it), and Spain (.es).',
    category: 'Getting Started',
  },
  {
    question: 'How do I export my data?',
    answer: 'Navigate to the Exports page to download your data in CSV, JSON, or Excel formats. You can also configure automated exports to Google Sheets, Notion, or Airtable.',
    category: 'Features',
  },
  {
    question: 'Can I schedule automated tasks?',
    answer: 'Yes! Navigate to the "Schedules" tab to set up recurring tasks. You can configure them to run daily, weekly, or at custom intervals to suit your workflow.',
    category: 'Features',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, AMEX) and PayPal via our secure payment processor, Dodo Payments.',
    category: 'Billing',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time from the Billing page. Your access remains active until the end of your current billing cycle.',
    category: 'Billing',
  },
  {
    question: 'How do I set up webhooks?',
    answer: 'Go to Integrations > Webhooks. Click "Add Webhook", provide your endpoint URL, and select the events to subscribe to. Use the test function to verify.',
    category: 'Integrations',
  },
  {
    question: 'Is my data secure?',
    answer: 'Security is our top priority. All data is encrypted in transit and at rest. We never store your Amazon credentials and offer 2FA for account protection.',
    category: 'Security',
  },
];

const tutorials: Tutorial[] = [
  {
    id: 'tut-1',
    title: 'Getting Started with AMZBoosted',
    description: 'Learn the basics and set up your first analysis',
    duration: '5:30',
    thumbnail: '',
    url: '#',
  },
  {
    id: 'tut-2',
    title: 'Setting Up Automated Reports',
    description: 'Schedule recurring tasks and exports',
    duration: '8:15',
    thumbnail: '',
    url: '#',
  },
  {
    id: 'tut-3',
    title: 'Integrating with Google Sheets',
    description: 'Connect your account and automate data exports',
    duration: '6:45',
    thumbnail: '',
    url: '#',
  },
];

const systemStatus: SystemStatus[] = [
  { service: 'API', status: 'operational', uptime: '99.99%' },
  { service: 'Scraping Engine', status: 'operational', uptime: '99.95%' },
  { service: 'Integrations', status: 'operational', uptime: '99.97%' },
  { service: 'Dashboard', status: 'operational', uptime: '99.99%' },
];

const statusIcons: Record<SystemStatus['status'], React.ElementType> = {
  operational: CheckCircle2,
  degraded: AlertCircle,
  down: XCircle,
};

const statusColors: Record<SystemStatus['status'], string> = {
  operational: 'text-emerald-500',
  degraded: 'text-yellow-500',
  down: 'text-red-500',
};

export const SupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ToolPageLayout
      title='Help & <span class="text-[#FF6B00]">Support</span>'
      subtitle="Find answers, tutorials, and join our community."
      icon={LifeBuoy}
      badge="Support Center"
      iconBgClass="bg-[#FF6B00]/10"
      iconColorClass="text-[#FF6B00]"
      showBackButton={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* FAQ Section */}
          <div className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                  <p className="text-sm text-gray-400">Search for help or browse categories</p>
                </div>
             </div>

             <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search FAQs (e.g., 'API', 'Billing', 'Export')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base bg-black/40 border-white/10 focus:border-[#FF6B00]/50 focus:ring-1 focus:ring-[#FF6B00]/20 rounded-xl"
                    />
                  </div>
                </div>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs.map((item, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border-b border-white/5 last:border-0 px-6 data-[state=open]:bg-[#FF6B00]/[0.02] transition-colors">
                        <AccordionTrigger className="text-left hover:text-[#FF6B00] hover:no-underline py-5 text-[15px] font-medium group">
                          <div className="flex items-center gap-3">
                             <div className="h-1.5 w-1.5 rounded-full bg-gray-600 group-hover:bg-[#FF6B00] transition-colors" />
                            <span>{item.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-1 pl-4.5">
                          <div className="pl-4 border-l-2 border-white/10 ml-0.5 space-y-3">
                            <p className="text-gray-400 leading-relaxed">{item.answer}</p>
                            <Badge variant="outline" className="text-[#FF6B00] border-[#FF6B00]/20 bg-[#FF6B00]/5 text-[10px] h-5">{item.category}</Badge>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {filteredFAQs.length === 0 && (
                     <div className="text-center py-12 px-6">
                       <div className="bg-[#FF6B00]/10 p-3 rounded-full w-fit mx-auto mb-3">
                         <HelpCircle className="h-6 w-6 text-[#FF6B00]" />
                       </div>
                       <p className="text-gray-400">No FAQs match your search</p>
                       <Button variant="link" className="text-[#FF6B00] mt-1 h-auto p-0" onClick={() => setSearchQuery('')}>Clear search</Button>
                     </div>
                  )}
                </CardContent>
             </Card>
          </div>

          {/* Video Tutorials Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Video Tutorials</h2>
                  <p className="text-sm text-gray-400">Step-by-step guides to master the platform</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="overflow-hidden bg-[#0A0A0B]/60 border-white/5 hover:border-[#FF6B00]/30 transition-all group hover:shadow-[0_0_20px_-10px_theme(colors.orange.500)] cursor-pointer">
                    <div className="aspect-video bg-black/40 flex items-center justify-center relative group-hover:bg-black/60 transition-colors border-b border-white/5">
                      <PlayCircle className="h-12 w-12 text-white/80 group-hover:text-[#FF6B00] group-hover:scale-110 transition-all drop-shadow-lg" />
                      <Badge variant="secondary" className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white border-white/10">{tutorial.duration}</Badge>
                    </div>
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-[#FF6B00] transition-colors">{tutorial.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-gray-500 line-clamp-2">{tutorial.description}</p>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>

        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-8">
          
          {/* Community Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white">Community</h3>
            </div>
            
            <div className="grid gap-3">
               <Card className="bg-[#5865F2]/5 border-[#5865F2]/20 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/40 transition-all group cursor-pointer relative overflow-hidden">
                   <div className="p-4 flex items-center gap-4">
                       <div className="h-10 w-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#5865F2]/20 group-hover:scale-105 transition-transform">
                           <MessageCircle className="h-5 w-5" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-white text-sm">Discord Server</h4>
                           <p className="text-xs text-[#5865F2]/80 truncate">Join the conversation</p>
                       </div>
                       <ExternalLink className="h-4 w-4 text-[#5865F2] opacity-50 group-hover:opacity-100 transition-opacity" />
                   </div>
               </Card>

               <Card className="bg-[#229ED9]/5 border-[#229ED9]/20 hover:bg-[#229ED9]/10 hover:border-[#229ED9]/40 transition-all group cursor-pointer relative overflow-hidden">
                   <div className="p-4 flex items-center gap-4">
                       <div className="h-10 w-10 rounded-lg bg-[#229ED9] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#229ED9]/20 group-hover:scale-105 transition-transform">
                           <Send className="h-5 w-5 ml-0.5 mt-0.5" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-white text-sm">Telegram Channel</h4>
                           <p className="text-xs text-[#229ED9]/80 truncate">Instant updates & news</p>
                       </div>
                       <ExternalLink className="h-4 w-4 text-[#229ED9] opacity-50 group-hover:opacity-100 transition-opacity" />
                   </div>
               </Card>
            </div>
          </div>

          {/* Documentation Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white">Documentation</h3>
            </div>

            <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 divide-y divide-white/5">
                {[
                  { title: 'Getting Started', icon: Zap },
                  { title: 'API Reference', icon: FileText },
                  { title: 'Integrations', icon: ExternalLink },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group transition-colors">
                      <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-gray-500 group-hover:text-[#FF6B00] transition-colors" />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.title}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-gray-600 group-hover:text-gray-400" />
                  </div>
                ))}
            </Card>
          </div>

          {/* System Status */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white">System Status</h3>
            </div>
             <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 p-4 space-y-3">
                {systemStatus.map((item) => {
                  const Icon = statusIcons[item.status];
                  const colorClass = statusColors[item.status];
                  return (
                    <div key={item.service} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={cn("h-1.5 w-1.5 rounded-full", item.status === 'operational' ? "bg-emerald-500" : "bg-red-500")} />
                         <span className="text-xs font-medium text-gray-400">{item.service}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] h-5 border-0 bg-transparent px-0 font-mono", colorClass)}>
                         {item.uptime}
                      </Badge>
                    </div>
                  );
                })}
                <Separator className="bg-white/5 my-2" />
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                   <span>Last updated: just now</span>
                   <span className="text-emerald-500">All systems normal</span>
                </div>
             </Card>
          </div>

           {/* Email Support Footer */}
           <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-gray-500/10 text-gray-400">
                    <Mail className="w-4 h-4" />
                 </div>
                 <div>
                    <h4 className="text-sm font-medium text-white">Need personal help?</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-2">Our support team is available mon-fri.</p>
                    <a href="mailto:support@amzboosted.com" className="text-xs text-[#FF6B00] hover:underline flex items-center gap-1">
                       support@amzboosted.com <ExternalLink className="h-3 w-3" />
                    </a>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </ToolPageLayout>
  );
};
