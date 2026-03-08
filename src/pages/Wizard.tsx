import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  UtensilsCrossed, 
  Image, 
  Palette, 
  Globe, 
  CreditCard, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Sparkles,
  Upload,
  Loader2
} from "lucide-react";

// Wizard uses Platform API (port 3000), not Admin API (port 3001)
const API_URL = import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:3000';

// Test data for prefilling
const TEST_DATA = {
  email: "test@helmies.fi",
  restaurantInfo: {
    name: "Test Ravintola",
    name_en: "Test Restaurant",
    description: "Aito suomalainen ravintola tarjoaa maukkaita kotiruokia ja lämminhenkistä palvelua keskellä kaupunkia.",
    description_en: "Authentic Finnish restaurant offering delicious home-cooked meals and warm service in the heart of the city.",
    cuisine: "Finnish",
    phone: "+358401234567",
    email: "info@testravintola.fi",
    address: {
      street: "Aleksanterinkatu 52",
      city: "Helsinki",
      postal_code: "00100",
      country: "Finland"
    }
  },
  features: {
    delivery: true,
    pickup: true,
    cashOnDelivery: false,
    lunch: true,
    loyalty: true,
    aiAssistant: true
  },
  theme: {
    primary_color: "#e65100",
    secondary_color: "#ff9800",
    accent_color: "#ffb74d",
    background_color: "#ffffff",
    text_color: "#212121",
    style: "modern"
  },
  domain: {
    slug: "test-ravintola",
    custom_domain: ""
  },
  stripe: {
    test_mode: true,
    publishable_key: "pk_test_example",
    secret_key: "sk_test_example"
  }
};

const STEPS = [
  { id: "restaurant-info", label: "Restaurant Info", icon: Building2 },
  { id: "menu", label: "Menu & Images", icon: UtensilsCrossed },
  { id: "theme", label: "Theme & Logo", icon: Palette },
  { id: "features", label: "Features", icon: CheckCircle },
  { id: "domain", label: "Domain", icon: Globe },
  { id: "review", label: "Review", icon: Rocket }
];

export default function Wizard() {
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get("test") === "true";
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Form data state
  const [email, setEmail] = useState(isTestMode ? TEST_DATA.email : "");
  const [restaurantInfo, setRestaurantInfo] = useState(isTestMode ? TEST_DATA.restaurantInfo : {
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    cuisine: "",
    phone: "",
    email: "",
    address: { street: "", city: "", postal_code: "", country: "Finland" }
  });
  const [features, setFeatures] = useState(isTestMode ? TEST_DATA.features : {
    delivery: true,
    pickup: true,
    cashOnDelivery: false,
    lunch: false,
    loyalty: false,
    aiAssistant: false
  });
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuText, setMenuText] = useState("");
  const [menuParsed, setMenuParsed] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [testImageLoading, setTestImageLoading] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSvg, setLogoSvg] = useState<string | null>(null);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [wizardComplete, setWizardComplete] = useState(false);
  const [completedData, setCompletedData] = useState<any>(null);
  const [theme, setTheme] = useState(isTestMode ? TEST_DATA.theme : {
    primary_color: "#e65100",
    secondary_color: "#ff9800",
    accent_color: "#ffb74d",
    background_color: "#ffffff",
    text_color: "#212121",
    style: "modern"
  });
  const [domain, setDomain] = useState(isTestMode ? TEST_DATA.domain : {
    slug: "",
    custom_domain: ""
  });
  const [stripe, setStripe] = useState(isTestMode ? TEST_DATA.stripe : {
    test_mode: true,
    publishable_key: "",
    secret_key: ""
  });
  const [operatingHours, setOperatingHours] = useState({
    opening: "10:00-22:00",
    pickup: "10:00-22:00",
    delivery: "10:00-21:30",
    lunch: "11:00-14:00"
  });

  // Handle menu file upload
  const [menuFile, setMenuFile] = useState<File | null>(null);
  
  const handleMenuFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMenuFile(file);
    
    // For text files, also load into textarea
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      const text = await file.text();
      setMenuText(text);
      toast({ title: "File loaded", description: `Loaded ${file.name}` });
    } else {
      toast({ 
        title: "File selected", 
        description: `${file.name} ready. Click "Parse Menu with AI" to extract items.` 
      });
    }
  };

  // Parse menu with AI
  const parseMenuWithAI = async () => {
    if (!menuFile && !menuText) {
      toast({ title: "Error", description: "Please upload a file or paste menu text first", variant: "destructive" });
      return;
    }

    if (!sessionId) {
      toast({ title: "Error", description: "No active session", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      
      if (menuFile) {
        formData.append('file', menuFile);
      } else if (menuText) {
        // Create a text file from the pasted text
        const textBlob = new Blob([menuText], { type: 'text/plain' });
        formData.append('file', textBlob, 'menu.txt');
      }

      const response = await fetch(`${API_URL}/api/wizard/parse-menu`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse menu');
      }

      const data = await response.json();
      console.log('Parse menu response:', data);
      
      // Handle both response formats
      const items = data.menuItems || data.menu?.items || [];
      const categories = data.menu?.categories || [];
      
      if (items.length > 0 || categories.length > 0) {
        // Flatten categories into items if needed, and add imageUrl field
        const allItems = (items.length > 0 ? items : categories.flatMap((cat: any) => cat.items || []))
          .map((item: any) => ({ ...item, imageUrl: item.imageUrl || null }));
        setMenuItems(allItems);
        setMenuParsed(true);
        toast({ 
          title: "Menu parsed!", 
          description: `Found ${allItems.length} items. You can now edit them and add images.` 
        });
      } else {
        toast({ 
          title: "No items found", 
          description: "Could not extract menu items. Try pasting the text manually.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Menu parse error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to parse menu", 
        variant: "destructive" 
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Test food image generation (test mode only)
  const testFoodImageGeneration = async () => {
    if (!sessionId || menuItems.length === 0) {
      toast({ title: "Error", description: "No session or menu items", variant: "destructive" });
      return;
    }

    setTestImageLoading(true);
    setTestImageUrl(null);
    
    try {
      const response = await fetch(`${API_URL}/api/wizard/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          menuItems: [menuItems[0]], // Only first item
          theme,
          testMode: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details || 'Failed to generate image');
      }

      const data = await response.json();
      console.log('Test image response:', data);
      
      if (data.images && data.images.length > 0) {
        setTestImageUrl(data.images[0].imageUrl);
        toast({ 
          title: "Image generated!", 
          description: data.message 
        });
      } else {
        toast({ 
          title: "No image", 
          description: "Image generation returned no results",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Test image error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate test image", 
        variant: "destructive" 
      });
    } finally {
      setTestImageLoading(false);
    }
  };

  // Generate food images for all menu items (PAID - €20)
  const generateFoodImages = async () => {
    if (!sessionId) {
      toast({ title: "Error", description: "No session", variant: "destructive" });
      return;
    }

    if (menuItems.length === 0) {
      toast({ 
        title: "No menu items", 
        description: "Please add menu items first (Step 5 - Menu)", 
        variant: "destructive" 
      });
      return;
    }

    setAiLoading(true);
    
    try {
      toast({ 
        title: "Generating images...", 
        description: `Creating ${menuItems.length} food images. This may take a few minutes.` 
      });

      const response = await fetch(`${API_URL}/api/wizard/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          menuItems,
          theme,
          testMode: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details || 'Failed to generate images');
      }

      const data = await response.json();
      console.log('Food images response:', data);
      
      if (data.images && data.images.length > 0) {
        // Update menu items with generated images
        const updatedItems = menuItems.map(item => {
          const generated = data.images.find((img: any) => 
            img.name === item.name || img.menuItemId === item.name
          );
          if (generated?.imageUrl) {
            return { ...item, imageUrl: generated.imageUrl };
          }
          return item;
        });
        setMenuItems(updatedItems);
        toast({ 
          title: "Images generated!", 
          description: `Created ${data.images.length} food images` 
        });
      } else {
        toast({ 
          title: "Warning", 
          description: "No images were generated",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Food images error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate food images", 
        variant: "destructive" 
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Generate image for a single menu item
  const generateSingleItemImage = async (index: number) => {
    if (!sessionId) return;
    
    const item = menuItems[index];
    setGeneratingImageIndex(index);
    
    try {
      const response = await fetch(`${API_URL}/api/wizard/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          menuItems: [item],
          theme,
          testMode: true, // Single item = test mode pricing
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      if (data.images?.[0]?.imageUrl) {
        const updatedItems = [...menuItems];
        updatedItems[index] = { ...item, imageUrl: data.images[0].imageUrl };
        setMenuItems(updatedItems);
        toast({ title: "Image generated!", description: item.name });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  // Update a menu item field
  const updateMenuItem = (index: number, field: string, value: any) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setMenuItems(updatedItems);
  };

  // Delete a menu item
  const deleteMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  // Add a new menu item manually
  const addMenuItem = () => {
    setMenuItems([...menuItems, {
      name: "",
      name_en: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: null
    }]);
  };

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
      setLogoSvg(null);
      toast({ title: "Logo uploaded!", description: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Generate logo with AI
  const generateLogo = async () => {
    if (!restaurantInfo.name) {
      toast({ title: "Error", description: "Please enter restaurant name first", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wizard/generate-branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          restaurantName: restaurantInfo.name,
          cuisine: restaurantInfo.cuisine || "Restaurant"
        })
      });

      if (!response.ok) throw new Error('Failed to generate logo');

      const data = await response.json();
      if (data.branding?.logoUrl) {
        setLogoUrl(data.branding.logoUrl);
        setLogoSvg(data.branding.logoSvg || null);
        // Also update colors if returned
        if (data.branding.colors) {
          setTheme({
            ...theme,
            primary_color: data.branding.colors.primary || theme.primary_color,
            secondary_color: data.branding.colors.secondary || theme.secondary_color,
            accent_color: data.branding.colors.accent || theme.accent_color,
            background_color: data.branding.colors.background || theme.background_color,
            text_color: data.branding.colors.foreground || theme.text_color,
          });
        }
        toast({ title: "Logo & colors generated!", description: "AI created your branding" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Start or resume wizard session
  const startWizard = async () => {
    if (!email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting wizard with API:', API_URL);
      const response = await fetch(`${API_URL}/api/wizard/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.session) {
        setSessionId(data.session.id);
        if (data.resumed && data.session.data) {
          // Restore saved data
          if (data.session.data.restaurantInfo) setRestaurantInfo(data.session.data.restaurantInfo);
          if (data.session.data.features) setFeatures(data.session.data.features);
          if (data.session.data.menuItems) setMenuItems(data.session.data.menuItems);
          if (data.session.data.theme) setTheme(data.session.data.theme);
          if (data.session.data.domain) setDomain(data.session.data.domain);
        }
        setCurrentStep(1);
        toast({ 
          title: data.resumed ? "Session Resumed" : "Session Started",
          description: `Session ID: ${data.session.id.slice(0, 8)}...`
        });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No session returned from API');
      }
    } catch (error) {
      console.error('Wizard error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to start wizard", 
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  // Save step data
  const saveStep = async (step: string, stepData: any) => {
    if (!sessionId) return;

    try {
      await fetch(`${API_URL}/api/wizard/step/${step}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, step, data: stepData })
      });
    } catch (error) {
      console.error("Failed to save step:", error);
    }
  };

  // AI generate branding
  const generateBranding = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wizard/generate-branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          restaurantName: restaurantInfo.name,
          cuisine: restaurantInfo.cuisine
        })
      });

      const data = await response.json();
      if (data.success && data.branding) {
        setTheme({
          ...theme,
          primary_color: data.branding.colors?.primary || theme.primary_color,
          secondary_color: data.branding.colors?.secondary || theme.secondary_color,
          accent_color: data.branding.colors?.accent || theme.accent_color
        });
        toast({ title: "AI Generated", description: "Theme colors generated!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "AI generation failed", variant: "destructive" });
    }
    setAiLoading(false);
  };

  // Complete wizard
  const completeWizard = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wizard/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          restaurantInfo,
          features,
          menuItems,
          theme,
          domain,
          stripe,
          logoUrl,
          logoSvg,
          operatingHours
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create restaurant");
      }
      
      if (data.tenant) {
        setCompletedData(data);
        setWizardComplete(true);
        toast({ 
          title: "🎉 Restaurant Created!", 
          description: `Your restaurant is ready!`
        });
      } else {
        throw new Error(data.error || "Failed to create restaurant");
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to complete wizard", 
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  const nextStep = () => {
    // currentStep 1-6 maps to STEPS[0-5]
    const stepId = STEPS[currentStep - 1]?.id;
    
    // Validation for Step 2 (Menu) - must parse first
    if (currentStep === 2 && !menuParsed) {
      toast({ 
        title: "Parse your menu first!", 
        description: "Upload a file or paste text, then click 'Parse Menu with AI'", 
        variant: "destructive" 
      });
      return;
    }
    
    // Save step data
    if (stepId === "restaurant-info") saveStep(stepId, { restaurantInfo });
    if (stepId === "menu") saveStep(stepId, { menuItems });
    if (stepId === "theme") saveStep(stepId, { theme, logoUrl, logoSvg });
    if (stepId === "features") saveStep(stepId, { features, operatingHours });
    if (stepId === "domain") saveStep(stepId, { domain });
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Step 0: Email entry
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Create Your Restaurant</CardTitle>
            <CardDescription>
              Set up your restaurant in minutes with our AI-powered wizard
            </CardDescription>
            {isTestMode && (
              <Badge variant="secondary" className="mt-2">🧪 Test Mode - Data Prefilled</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={startWizard}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Start Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (wizardComplete && completedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">🎉 Restaurant Created!</CardTitle>
            <CardDescription>
              Your restaurant "{completedData.tenant?.name || restaurantInfo.name}" is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Your Website</Label>
                <a 
                  href={completedData.siteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-orange-600 hover:underline font-medium"
                >
                  {completedData.siteUrl} ↗
                </a>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Admin Panel</Label>
                <a 
                  href={completedData.adminUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-orange-600 hover:underline font-medium"
                >
                  {completedData.adminUrl} ↗
                </a>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  {completedData.tenant?.status || 'pending'} - Setting up...
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Your site is being set up. This may take a few minutes. 
              You'll receive an email when it's ready!
            </p>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Create Another
              </Button>
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={() => window.open(completedData.adminUrl, '_blank')}
              >
                Go to Admin ↗
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, idx) => {
              const stepNum = idx + 1; // Step 1-6
              const Icon = step.icon;
              const isActive = stepNum === currentStep;
              const isComplete = stepNum < currentStep;
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? "text-orange-600" : isComplete ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? "bg-orange-100" : isComplete ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {isComplete ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = STEPS[currentStep - 1]?.icon || Building2;
                return <Icon className="w-5 h-5" />;
              })()}
              {STEPS[currentStep - 1]?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step 1: Restaurant Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Restaurant Name (Finnish)</Label>
                    <Input
                      value={restaurantInfo.name}
                      onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                      placeholder="Ravintola Nimi"
                    />
                  </div>
                  <div>
                    <Label>Restaurant Name (English)</Label>
                    <Input
                      value={restaurantInfo.name_en}
                      onChange={(e) => setRestaurantInfo({...restaurantInfo, name_en: e.target.value})}
                      placeholder="Restaurant Name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Cuisine Type</Label>
                  <Input
                    value={restaurantInfo.cuisine}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, cuisine: e.target.value})}
                    placeholder="e.g., Finnish, Italian, Middle Eastern"
                  />
                </div>

                <div>
                  <Label>Description (Finnish)</Label>
                  <Textarea
                    value={restaurantInfo.description}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, description: e.target.value})}
                    placeholder="Kuvaus ravintolasta..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Description (English)</Label>
                  <Textarea
                    value={restaurantInfo.description_en}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, description_en: e.target.value})}
                    placeholder="Description of your restaurant..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={restaurantInfo.phone}
                      onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                      placeholder="+358..."
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={restaurantInfo.email}
                      onChange={(e) => setRestaurantInfo({...restaurantInfo, email: e.target.value})}
                      placeholder="info@restaurant.fi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Street Address</Label>
                    <Input
                      value={restaurantInfo.address.street}
                      onChange={(e) => setRestaurantInfo({
                        ...restaurantInfo, 
                        address: {...restaurantInfo.address, street: e.target.value}
                      })}
                      placeholder="Aleksanterinkatu 52"
                    />
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <Input
                      value={restaurantInfo.address.postal_code}
                      onChange={(e) => setRestaurantInfo({
                        ...restaurantInfo, 
                        address: {...restaurantInfo.address, postal_code: e.target.value}
                      })}
                      placeholder="00100"
                    />
                  </div>
                </div>

                <div>
                  <Label>City</Label>
                  <Input
                    value={restaurantInfo.address.city}
                    onChange={(e) => setRestaurantInfo({
                      ...restaurantInfo, 
                      address: {...restaurantInfo.address, city: e.target.value}
                    })}
                    placeholder="Helsinki"
                  />
                </div>

              </div>
            )}

            {/* Step 2: Menu & Images (Merged) */}
            {currentStep === 2 && (
              <div className="space-y-4 relative">
                {/* Loading overlay */}
                {aiLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                    <p className="text-lg font-medium">Processing...</p>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                )}

                {/* SECTION 1: Upload/Parse Menu (only show if not parsed yet) */}
                {!menuParsed && (
                  <>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-medium">Upload your menu</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        PDF, image, or Excel file - AI will extract items
                      </p>
                      <input
                        type="file"
                        ref={menuFileInputRef}
                        onChange={handleMenuFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xlsx,.xls"
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => menuFileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      {menuFile && (
                        <p className="mt-2 text-sm text-green-600">✓ {menuFile.name}</p>
                      )}
                    </div>

                    <div className="text-center text-sm text-muted-foreground">— or paste text —</div>

                    <Textarea
                      placeholder="Paste your menu here...&#10;&#10;Example:&#10;Margherita Pizza - 12.50€&#10;Pepperoni Pizza - 14.00€"
                      rows={4}
                      value={menuText}
                      onChange={(e) => setMenuText(e.target.value)}
                    />

                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                      onClick={parseMenuWithAI}
                      disabled={aiLoading || (!menuFile && !menuText)}
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Parse Menu with AI
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      ⚠️ You must parse your menu before continuing
                    </p>
                  </>
                )}

                {/* SECTION 2: Editable Menu Items + Images (after parsing) */}
                {menuParsed && menuItems.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg">📋 Menu Items ({menuItems.length})</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={addMenuItem}>
                          + Add Item
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setMenuParsed(false); setMenuItems([]); }}>
                          Re-parse
                        </Button>
                      </div>
                    </div>

                    {/* Generate All Images Button */}
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={generateFoodImages}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate All Images with AI ({menuItems.filter(i => !i.imageUrl).length} missing)
                    </Button>

                    {/* Scrollable Items List */}
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                      {menuItems.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex gap-3">
                            {/* Image Section */}
                            <div className="w-24 h-24 flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded-lg flex flex-col items-center justify-center text-xs text-gray-500">
                                  <Image className="w-6 h-6 mb-1" />
                                  No image
                                </div>
                              )}
                            </div>

                            {/* Fields Section */}
                            <div className="flex-1 space-y-2">
                              <Input
                                value={item.name || ""}
                                onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                                placeholder="Item name"
                                className="font-medium"
                              />
                              <div className="flex gap-2">
                                <Input
                                  value={item.description || ""}
                                  onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                                  placeholder="Description (optional)"
                                  className="flex-1 text-sm"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.price || ""}
                                  onChange={(e) => updateMenuItem(index, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="Price"
                                  className="w-24"
                                />
                              </div>
                              
                              {/* Image Actions */}
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => generateSingleItemImage(index)}
                                  disabled={generatingImageIndex === index}
                                  className="text-xs"
                                >
                                  {generatingImageIndex === index ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                  )}
                                  Generate
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          updateMenuItem(index, 'imageUrl', ev.target?.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-xs text-red-500 hover:text-red-700 ml-auto"
                                  onClick={() => deleteMenuItem(index)}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Warning if items missing images */}
                    {menuItems.some(i => !i.imageUrl) && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ {menuItems.filter(i => !i.imageUrl).length} items missing images. You can add them now or later.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Theme & Logo */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Logo Section */}
                <div className="border rounded-lg p-4">
                  <Label className="text-base font-semibold mb-3 block">🎨 Logo</Label>
                  
                  <div className="flex gap-4 items-start">
                    {/* Logo Preview */}
                    <div className="w-24 h-24 flex-shrink-0 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-400 text-xs text-center">No logo</span>
                      )}
                    </div>

                    {/* Logo Actions */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*,.svg"
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => logoFileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={generateLogo}
                        disabled={aiLoading || !restaurantInfo.name}
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate Logo with AI
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base font-semibold">🎨 Colors</Label>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={generateLogo}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      AI Colors
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries({
                      primary_color: "Primary",
                      secondary_color: "Secondary",
                      accent_color: "Accent",
                      background_color: "Background",
                      text_color: "Text"
                    }).map(([key, label]) => (
                      <div key={key}>
                        <Label className="text-xs">{label}</Label>
                        <div className="flex gap-1 mt-1">
                          <input
                            type="color"
                            value={(theme as any)[key]}
                            onChange={(e) => setTheme({...theme, [key]: e.target.value})}
                            className="w-8 h-8 rounded cursor-pointer border"
                          />
                          <Input
                            value={(theme as any)[key]}
                            onChange={(e) => setTheme({...theme, [key]: e.target.value})}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{ backgroundColor: theme.background_color, color: theme.text_color }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />}
                    <h3 className="text-lg font-bold" style={{ color: theme.primary_color }}>
                      {restaurantInfo.name || "Your Restaurant"}
                    </h3>
                  </div>
                  <p className="text-sm mb-3">{restaurantInfo.description?.slice(0, 80) || "Restaurant description..."}</p>
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: theme.primary_color }}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Features */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Select the features you want for your restaurant:</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries({
                    delivery: { icon: "🚚", label: "Delivery", desc: "Deliver orders to customers" },
                    pickup: { icon: "🏪", label: "Pickup", desc: "Customers pick up orders" },
                    cashOnDelivery: { icon: "💵", label: "Cash on Delivery", desc: "Accept cash payments" },
                    lunch: { icon: "🍽️", label: "Lunch Menu", desc: "Special lunch offerings" },
                    loyalty: { icon: "⭐", label: "Loyalty Program", desc: "Reward returning customers" },
                    aiAssistant: { icon: "🤖", label: "AI Assistant", desc: "Smart order suggestions" }
                  }).map(([key, { icon, label, desc }]) => (
                    <label 
                      key={key} 
                      className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        (features as any)[key] 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(features as any)[key]}
                          onChange={(e) => setFeatures({...features, [key]: e.target.checked})}
                          className="rounded accent-orange-500"
                        />
                        <span className="text-lg">{icon}</span>
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 ml-6">{desc}</span>
                    </label>
                  ))}
                </div>

                {/* Operating Hours Section */}
                <div className="border rounded-lg p-4 mt-4">
                  <Label className="text-base font-semibold mb-3 block">🕐 Operating Hours</Label>
                  <p className="text-sm text-muted-foreground mb-3">Set your restaurant's opening hours (format: HH:MM-HH:MM)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">General Opening Hours</Label>
                      <Input
                        value={operatingHours.opening}
                        onChange={(e) => setOperatingHours({...operatingHours, opening: e.target.value})}
                        placeholder="10:00-22:00"
                        className="mt-1"
                      />
                    </div>
                    
                    {features.pickup && (
                      <div>
                        <Label className="text-sm">Pickup Hours</Label>
                        <Input
                          value={operatingHours.pickup}
                          onChange={(e) => setOperatingHours({...operatingHours, pickup: e.target.value})}
                          placeholder="10:00-22:00"
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    {features.delivery && (
                      <div>
                        <Label className="text-sm">Delivery Hours</Label>
                        <Input
                          value={operatingHours.delivery}
                          onChange={(e) => setOperatingHours({...operatingHours, delivery: e.target.value})}
                          placeholder="10:00-21:30"
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    {features.lunch && (
                      <div>
                        <Label className="text-sm">Lunch Buffet Hours</Label>
                        <Input
                          value={operatingHours.lunch}
                          onChange={(e) => setOperatingHours({...operatingHours, lunch: e.target.value})}
                          placeholder="11:00-14:00"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Domain */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label>Subdomain (Free)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={domain.slug}
                      onChange={(e) => setDomain({...domain, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="your-restaurant"
                    />
                    <span className="text-muted-foreground">.helmiesbites.com</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your restaurant will be available at: {domain.slug || "your-restaurant"}.helmiesbites.com
                  </p>
                </div>

                <div className="border-t pt-4">
                  <Label>Custom Domain (Optional)</Label>
                  <Input
                    value={domain.custom_domain}
                    onChange={(e) => setDomain({...domain, custom_domain: e.target.value})}
                    placeholder="www.yourrestaurant.fi"
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can add a custom domain later in settings
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Stripe */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">🎉 Almost Done!</h4>
                  <p className="text-sm text-green-700">
                    Review your restaurant details below and click "Launch Restaurant" to finish.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Restaurant Name</span>
                    <span className="font-medium">{restaurantInfo.name || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Cuisine</span>
                    <span>{restaurantInfo.cuisine || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Location</span>
                    <span>{restaurantInfo.address?.city || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-mono">{domain.slug || "auto"}.helmiesbites.com</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Features</span>
                    <span>
                      {Object.entries(features).filter(([_, v]) => v).map(([k]) => 
                        k === 'delivery' ? '🚚' : k === 'pickup' ? '🏪' : k === 'lunch' ? '🍽️' : k === 'loyalty' ? '⭐' : k
                      ).join(" ")}
                    </span>
                  </div>
                </div>

                {/* Payments Info */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    💳 Payments Included
                  </h4>
                  <p className="text-sm text-green-700 mt-2">
                    Online payments are automatically enabled through Helmies Bites. 
                    Your customers can pay with card, and you'll receive payouts to your bank account.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Card payments &nbsp; ✓ Apple Pay &nbsp; ✓ Google Pay
                  </p>
                </div>

                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={completeWizard}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                  🚀 Launch Restaurant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep <= 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep > 0 && currentStep < STEPS.length && (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
