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
  Sparkles
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";

type Category = { id: string; name: string };
type LinkItem = { id: string; url: string; title: string; description: string; categoryId: string; dateAdded: string; isFavorite: boolean };

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, linksRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`), 
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links`)
        ]);
        if (catsRes.ok) {
          setCategories(await catsRes.json());
        }
        if (linksRes.ok) {
          setLinks(await linksRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // New Link State
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLinkCategory, setNewLinkCategory] = useState("dev");

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState("");

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          link.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    if (activeCategory === "favorites") return link.isFavorite && matchesSearch;
    return link.categoryId === activeCategory && matchesSearch;
  });

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newTitle) return;
 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    // Optimistic update
    setLinks(links.map(link => link.id === id ? { ...link, isFavorite: !link.isFavorite } : link));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links/${id}/favorite`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      // Revert on failure
      setLinks(links.map(link => link.id === id ? { ...link, isFavorite: !link.isFavorite } : link));
    }
  };

  const deleteLink = async (id: string) => {
    // Optimistic update
    const previousLinks = [...links];
    setLinks(links.filter(link => link.id !== id));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      console.error("Failed to delete link", error);
      // Revert on failure
      setLinks(previousLinks);
    }
  };

  return (
    <div className="relative flex h-screen w-full bg-zinc-950 text-zinc-50 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Premium Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="relative z-10 w-72 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LinkIcon size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">LinkLocker</h1>
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={() => setIsAddLinkModalOpen(true)}
            className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-sm font-medium transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          >
            <Plus size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span>Save New Link</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Library</p>
            <button 
              onClick={() => setActiveCategory("all")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === "all" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <LayoutGrid size={16} className={activeCategory === "all" ? "text-indigo-400" : ""} />
              All Links
              <span className="ml-auto text-xs bg-black/30 px-2 py-0.5 rounded-full">{links.length}</span>
            </button>
            <button 
              onClick={() => setActiveCategory("favorites")}
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
              <button 
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Add Category"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {categories.map(cat => {
              const count = links.filter(l => l.categoryId === cat.id).length;
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${isActive ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                >
                  <Folder size={16} className={isActive ? "text-indigo-400" : "group-hover:text-indigo-400/70 transition-colors"} />
                  {cat.name}
                  <span className="ml-auto text-xs bg-black/30 px-2 py-0.5 rounded-full">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* User Profile Mockup */}
        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-pink-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-zinc-500 truncate">Pro Plan</p>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 bg-black/40">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight capitalize">
              {activeCategory === "all" ? "All Links" : activeCategory === "favorites" ? "Favorites" : categories.find(c => c.id === activeCategory)?.name}
            </h2>
            <p className="text-sm text-zinc-500">Manage and organize your saved content.</p>
          </div>
          
          <div className="relative group w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search links..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-white/5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white"
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {filteredLinks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Sparkles size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No links found</h3>
              <p className="text-zinc-500 text-sm mb-6">You haven't saved any links in this category yet. Start building your collection.</p>
              <Button onClick={() => setIsAddLinkModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6">
                Save your first link
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLinks.map(link => {
                const category = categories.find(c => c.id === link.categoryId);
                
                return (
                  <div key={link.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                          alt="" 
                          className="w-5 h-5 rounded-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                          }}
                        />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(link.id); }}
                          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-yellow-400 transition-colors"
                        >
                          <Star size={16} className={link.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                        </button>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{link.title}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{link.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-4 border-t border-white/5">
                      <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                        <Folder size={12} />
                        {category?.name || "Unknown"}
                      </span>
                      <span>{link.dateAdded}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Link Modal */}
      {isAddLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-xl font-semibold">Save New Link</h2>
              <button 
                onClick={() => setIsAddLinkModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddLink} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="Website Name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <textarea 
                  rows={3}
                  placeholder="What is this link about?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Category</label>
                <select
                  value={newLinkCategory}
                  onChange={(e) => setNewLinkCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5"
                  onClick={() => setIsAddLinkModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Save Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-xl font-semibold">New Category</h2>
              <button 
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Category Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Recipes"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
