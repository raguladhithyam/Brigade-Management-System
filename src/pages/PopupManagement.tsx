import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Save, Eye, Image as ImageIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PopupDialog } from '@/components/PopupDialog';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_POPUP, HomePopup, loadPopup, savePopup, popupHasContent } from '@/lib/popup';

const PopupManagement: React.FC = () => {
  const [form, setForm] = useState<Omit<HomePopup, 'updatedAt'>>(DEFAULT_POPUP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const popup = await loadPopup();
        const { updatedAt, ...rest } = popup;
        void updatedAt;
        setForm(rest);
      } catch (err) {
        console.error('Failed to load popup config:', err);
        toast.error('Failed to load popup settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (form.enabled && !popupHasContent({ ...form, updatedAt: 0 })) {
      toast.error('Add a title, message, or image before enabling the popup');
      return;
    }
    setSaving(true);
    try {
      await savePopup(form);
      toast.success(form.enabled ? 'Popup saved & live on the home page' : 'Popup saved (currently disabled)');
    } catch (err) {
      console.error('Failed to save popup config:', err);
      toast.error('Failed to save popup settings');
    } finally {
      setSaving(false);
    }
  };

  const previewPopup: HomePopup = { ...form, updatedAt: Date.now() };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" text="Loading popup settings…" className="text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Home Page Popup</h1>
              <p className="text-sm text-muted-foreground">Show an announcement to students on the home page</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!popupHasContent(previewPopup)}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Enable toggle */}
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-foreground">Show popup on home page</p>
                    <p className="text-sm text-muted-foreground">
                      When on, visitors see this popup when they open the home page.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={form.enabled ? 'success' : 'secondary'}>{form.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  <Switch checked={form.enabled} onCheckedChange={(v) => update('enabled', v)} />
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Popup Content</CardTitle>
                <CardDescription>Everything here is optional — fill in what you need.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="e.g., Welcome to Ignite 2026!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Write your announcement here. Line breaks are preserved."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <div className="relative">
                    <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="imageUrl"
                      value={form.imageUrl}
                      onChange={(e) => update('imageUrl', e.target.value)}
                      placeholder="https://…/banner.png"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buttonLabel">Button Label (optional)</Label>
                    <Input
                      id="buttonLabel"
                      value={form.buttonLabel}
                      onChange={(e) => update('buttonLabel', e.target.value)}
                      placeholder="e.g., Learn more"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonUrl">Button Link (optional)</Label>
                    <Input
                      id="buttonUrl"
                      value={form.buttonUrl}
                      onChange={(e) => update('buttonUrl', e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live preview card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Live Preview</CardTitle>
                <CardDescription>How the popup will look.</CardDescription>
              </CardHeader>
              <CardContent>
                {popupHasContent(previewPopup) ? (
                  <div className="overflow-hidden rounded-xl border border-border">
                    {form.imageUrl.trim() && (
                      <img
                        src={form.imageUrl}
                        alt="preview"
                        className="max-h-40 w-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                      />
                    )}
                    <div className="space-y-2 p-4">
                      {form.title.trim() && <p className="font-semibold text-foreground">{form.title}</p>}
                      {form.message.trim() && (
                        <p className="whitespace-pre-line text-sm text-muted-foreground">{form.message}</p>
                      )}
                      {form.buttonLabel.trim() && (
                        <div className="pt-1">
                          <span className="inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                            {form.buttonLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <Megaphone className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm">Add content to see a preview.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PopupDialog popup={previewPopup} open={previewOpen} onOpenChange={setPreviewOpen} />
    </Layout>
  );
};

export default PopupManagement;
