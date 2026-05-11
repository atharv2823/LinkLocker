"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Link as LinkIcon, 
  Folder, 
  Search, 
  ExternalLink, 
  Trash2, 
  LayoutGrid, 
  Star,
  X,
  ChevronRight,
  Sparkles,
  Menu,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";

type Category = { id: string; name: string };
type LinkItem = { id: string; url: string; title: string; description: string; categoryId: string; dateAdded: string; isFavorite: boolean };
type User = { id: string; email: string; name: string };

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth Form State
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  // Check for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('linklocker_token');
    const savedUser = localStorage.getItem('linklocker_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [catsRes, linksRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, { headers }), 
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links`, { headers })
        ]);
        
        if (catsRes.ok) setCategories(await catsRes.json());
        if (linksRes.ok) setLinks(await linksRes.json());
        
        if (catsRes.status === 401 || linksRes.status === 401) {
          handleLogout();
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [token]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isAuthMode === 'login' ? 'login' : 'signup';
    const body = isAuthMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, name: authName };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('linklocker_token', data.token);
        localStorage.setItem('linklocker_user', JSON.stringify(data.user));
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (error) {
      setAuthError("Server connection failed");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCategories([]);
    setLinks([]);
    localStorage.removeItem('linklocker_token');
    localStorage.removeItem('linklocker_user');
  };

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // New Link State
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLinkCategory, setNewLinkCategory] = useState("");

  useEffect(() => {
    const categoryExists = categories.some(cat => cat.id === newLinkCategory);
    if (categories.length > 0 && (!newLinkCategory || !categoryExists)) {
      const firstCategoryId = categories[0]?.id;
      if (firstCategoryId) {
        setNewLinkCategory(firstCategoryId);
      }
    }
  }, [categories, newLinkCategory]);

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState("");

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (link.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          link.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    if (activeCategory === "favorites") return link.isFavorite && matchesSearch;
    return link.categoryId === activeCategory && matchesSearch;
  });

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newTitle || !newLinkCategory) return;
 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          url: newUrl,
          title: newTitle,
          description: newDescription,
          categoryId: newLinkCategory,
        })
      });
      
      if (res.ok) {
        const newLink = await res.json();
        setLinks([newLink, ...links]);
        setIsAddLinkModalOpen(false);
        setNewUrl("");
        setNewTitle("");
        setNewDescription("");
      }
    } catch (error) {
      console.error("Failed to add link", error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
      
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setIsAddCategoryModalOpen(false);
        setNewCategoryName("");
        setNewLinkCategory(newCat.id);
      }
    } catch (error) {
      console.error("Failed to add category", error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const previousLinks = [...links];
    setLinks(links.map(link => link.id === id ? { ...link, isFavorite: !link.isFavorite } : link));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links/${id}/favorite`, { 
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      setLinks(previousLinks);
    }
  };

  const deleteLink = async (id: string) => {
    const previousLinks = [...links];
    setLinks(links.filter(link => link.id !== id));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      setLinks(previousLinks);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="relative h-screen w-full bg-zinc-950 text-zinc-50 font-sans flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <LinkIcon className="absolute top-[10%] left-[10%] text-indigo-500/20 rotate-12" size={120} />
          <Star className="absolute bottom-[20%] left-[15%] text-yellow-500/20 -rotate-12" size={80} />
          <Folder className="absolute top-[25%] right-[10%] text-purple-500/20 rotate-45" size={100} />
          <ShieldCheck className="absolute bottom-[10%] right-[20%] text-indigo-500/20 -rotate-12" size={140} />
        </div>
        
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />

        <div className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
              <LinkIcon size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to LinkLocker</h1>
            <p className="text-zinc-400 text-sm">Securely store and organize your digital world.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isAuthMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-white"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-white"
                />
              </div>
            </div>

            {authError && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-2 rounded-lg">{authError}</p>}

            <Button type="submit" className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 group">
              <span>{isAuthMode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              {isAuthMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => { setIsAuthMode(isAuthMode === 'login' ? 'signup' : 'login'); setAuthError(""); }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isAuthMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full bg-zinc-950 text-zinc-50 font-sans overflow-hidden selection:bg-indigo-500/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:relative z-50 lg:z-10 h-full w-72 border-r border-white/5 bg-zinc-950/80 lg:bg-black/20 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LinkIcon size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">LinkLocker</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-full hover:bg-white/5 text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={() => { setIsAddLinkModalOpen(true); setIsSidebarOpen(false); }}
            className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-sm font-medium transition-all"
          >
            <Plus size={16} className="text-indigo-400" />
            <span>Save New Link</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Library</p>
            <button 
              onClick={() => { setActiveCategory("all"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === "all" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <LayoutGrid size={16} className={activeCategory === "all" ? "text-indigo-400" : ""} />
              All Links
              <span className="ml-auto text-xs bg-black/30 px-2 py-0.5 rounded-full">{links.length}</span>
            </button>
            <button 
              onClick={() => { setActiveCategory("favorites"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === "favorites" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <Star size={16} className={activeCategory === "favorites" ? "text-yellow-400" : ""} />
              Favorites
              <span className="ml-auto text-xs bg-black/30 px-2 py-0.5 rounded-full">{links.filter(l => l.isFavorite).length}</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categories</p>
              <button onClick={() => setIsAddCategoryModalOpen(true)} className="text-zinc-500 hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${activeCategory === cat.id ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              >
                <Folder size={16} className={activeCategory === cat.id ? "text-indigo-400" : "group-hover:text-indigo-400/70"} />
                {cat.name}
                <span className="ml-auto text-xs bg-black/30 px-2 py-0.5 rounded-full">{links.filter(l => l.categoryId === cat.id).length}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 group-hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 flex flex-col min-w-0 bg-black/40">
        <header className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/5 text-zinc-400">
              <Menu size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold tracking-tight capitalize truncate">
                {activeCategory === "all" ? "All Links" : activeCategory === "favorites" ? "Favorites" : categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <p className="hidden sm:block text-xs md:text-sm text-zinc-500 truncate">Manage your personal collection.</p>
            </div>
          </div>
          
          <div className="relative group w-40 sm:w-64 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 md:pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-white/5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {filteredLinks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Sparkles size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No links found</h3>
              <p className="text-zinc-500 text-sm mb-6">Start building your personal collection today.</p>
              <Button onClick={() => setIsAddLinkModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 w-full sm:w-auto">
                Save your first link
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {filteredLinks.map(link => {
                const category = categories.find(c => c.id === link.categoryId);
                return (
                  <div 
                    key={link.id} 
                    className="group relative flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:bg-white/[0.07] transition-all cursor-pointer"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg sm:rounded-full bg-white/10 shrink-0 sm:mb-4">
                      <img src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} alt="" className="w-5 h-5 rounded-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm md:text-lg truncate text-zinc-100">{link.title}</h3>
                        <div className="hidden sm:flex gap-1 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(link.id); }} className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-yellow-400 transition-colors">
                            <Star size={16} className={link.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }} className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] md:text-sm text-zinc-400 line-clamp-1 sm:line-clamp-2 mb-2">{link.description || "No description"}</p>
                      <div className="flex items-center justify-between text-[10px] md:text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5 sm:bg-white/5 sm:px-2 sm:py-1 sm:rounded-md truncate">
                          <Folder size={12} className="text-indigo-400/70" />
                          <span className="truncate">{category?.name || "Uncategorized"}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex sm:hidden gap-1 pl-2 border-l border-white/5">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(link.id); }} className="p-2 text-zinc-500 active:text-yellow-400">
                        <Star size={18} className={link.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }} className="p-2 text-zinc-500 active:text-red-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {isAddLinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Save New Link</h2>
              <button onClick={() => setIsAddLinkModalOpen(false)} className="p-2 text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLink} className="p-6 space-y-4">
              <input type="url" required placeholder="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white" />
              <input type="text" required placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white" />
              <textarea placeholder="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white resize-none" />
              <select value={newLinkCategory} onChange={(e) => setNewLinkCategory(e.target.value)} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddLinkModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-500">Save Link</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input type="text" required placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddCategoryModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-500">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
