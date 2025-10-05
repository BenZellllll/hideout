import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tab {
  id: number;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
}

const Browser = () => {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: "New Tab", url: "", history: [], historyIndex: -1 }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nextTabId = useRef(2);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);

  const processUrl = (input: string): string => {
    if (!input) return "";
    
    // Check if it's a search query or URL
    if (!input.includes('.') || input.includes(' ')) {
      return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
    
    // Add https if no protocol
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      return `https://${input}`;
    }
    
    return input;
  };

  const loadUrl = async (url: string, tabId: number) => {
    if (!url) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-proxy', {
        body: { url }
      });

      if (error) throw error;

      // Update tab with new URL and history
      setTabs(prev => prev.map(tab => {
        if (tab.id === tabId) {
          const newHistory = tab.history.slice(0, tab.historyIndex + 1);
          newHistory.push(url);
          return {
            ...tab,
            url,
            title: new URL(url).hostname,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return tab;
      }));

      // Render content in iframe
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(data);
          doc.close();
        }
      }

    } catch (error) {
      console.error('Error loading page:', error);
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    const url = processUrl(urlInput);
    if (url && activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    
    const newIndex = activeTab.historyIndex - 1;
    const url = activeTab.history[newIndex];
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, historyIndex: newIndex, url } : tab
    ));
    
    loadUrl(url, activeTabId);
  };

  const handleForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    
    const newIndex = activeTab.historyIndex + 1;
    const url = activeTab.history[newIndex];
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, historyIndex: newIndex, url } : tab
    ));
    
    loadUrl(url, activeTabId);
  };

  const handleReload = () => {
    if (activeTab?.url) {
      loadUrl(activeTab.url, activeTabId);
    }
  };

  const handleHome = () => {
    setUrlInput("");
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, url: "", title: "New Tab" } : tab
    ));
  };

  const addTab = () => {
    const newTab: Tab = {
      id: nextTabId.current++,
      title: "New Tab",
      url: "",
      history: [],
      historyIndex: -1
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return;
    
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-card border-b border-border px-2 py-1">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer min-w-[200px] max-w-[200px] group ${
              activeTabId === tab.id ? 'bg-background' : 'bg-card hover:bg-muted'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="flex-1 truncate text-sm">{tab.title}</span>
            {tabs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addTab}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 bg-card border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={!activeTab || activeTab.historyIndex <= 0}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleForward}
          disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleReload} disabled={loading}>
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleHome}>
          <Home className="h-4 w-4" />
        </Button>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="flex-1">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search Google or type a URL"
            className="w-full"
          />
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-background">
        {activeTab?.url ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Browser Content"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">New Tab</h2>
              <p className="text-muted-foreground">Search Google or enter a URL to browse</p>
              <Button 
                onClick={() => navigate('/')}
                className="mt-4"
              >
                Back to Hideout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
