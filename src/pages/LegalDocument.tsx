import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Pencil, Save, X, Target, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast-wrapper";

interface LegalDoc {
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function LegalDocument({ slug }: { slug: "privacy" | "terms" }) {
  const { isSuperAdmin } = useOrganization();
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!cancelled) {
        if (error) toast.error("Failed to load document");
        setDoc(data as LegalDoc | null);
        setDraft(((data as LegalDoc | null)?.content) ?? "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("legal_documents")
      .update({ content: draft })
      .eq("slug", slug)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.message || "Failed to save");
      return;
    }
    setDoc(data as LegalDoc);
    setEditing(false);
    toast.success("Saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">ActionsPoint</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !doc ? (
          <p className="text-muted-foreground text-center py-20">Document not found.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{doc.title}</h1>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated {new Date(doc.updated_at).toLocaleDateString()}
                </p>
              </div>
              {isSuperAdmin && !editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
            </div>

            {editing ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Markdown supported. Use # for headings, - for lists, **bold**, _italic_.
                  </p>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={28}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDraft(doc.content);
                        setEditing(false);
                      }}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:hidden prose-h2:mt-8 prose-h2:text-xl prose-h3:text-lg prose-a:text-primary">
                <ReactMarkdown>{doc.content}</ReactMarkdown>
              </article>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-8 mt-10">
        <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
          <span>ActionsPoint © {new Date().getFullYear()}</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
