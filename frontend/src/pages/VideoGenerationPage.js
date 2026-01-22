import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoGenerationPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    duration: 5,
    aspect_ratio: '16:9',
    style: 'realistic'
  });

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API}/video-generation`);
      setVideos(response.data);
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await axios.post(`${API}/video-generation`, formData);
      toast.success(`Video generation started! ID: ${response.data.video_id}`);
      setDialogOpen(false);
      setFormData({
        prompt: '',
        duration: 5,
        aspect_ratio: '16:9',
        style: 'realistic'
      });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to start video generation');
    } finally {
      setGenerating(false);
    }
  };

  const statusIcons = {
    processing: <Loader className="w-5 h-5 animate-spin" />,
    completed: <CheckCircle className="w-5 h-5" />,
    failed: <XCircle className="w-5 h-5" />
  };

  const statusColors = {
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl font-serif">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="video-generation-page" className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">AI Video Generation</h1>
            <p className="text-muted-foreground">Create stunning videos with AI using Sora 2</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-sm uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Generate Video
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Generate New Video</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Video Prompt *</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="Describe the video you want to create... (e.g., 'A luxury furniture showroom with modern design, smooth camera movement')"
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="3"
                      max="10"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
                    <Select
                      value={formData.aspect_ratio}
                      onValueChange={(value) => setFormData({ ...formData, aspect_ratio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="style">Style</Label>
                    <Select
                      value={formData.style}
                      onValueChange={(value) => setFormData({ ...formData, style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realistic</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-md text-sm">
                  <p className="font-medium mb-2">💡 Tips for better results:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Be specific about scenes, camera movements, and lighting</li>
                    <li>Mention product details for furniture, paints, or windows</li>
                    <li>Include mood and atmosphere (elegant, modern, cozy)</li>
                    <li>Describe transitions if multiple scenes</li>
                  </ul>
                </div>
                <Button
                  type="submit"
                  disabled={generating}
                  className="w-full rounded-sm uppercase tracking-wider"
                >
                  {generating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.5} />
                      Generating...
                    </>
                  ) : (
                    'Generate Video'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 card-hover rounded-md">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                {video.status === 'completed' && video.video_url ? (
                  <video src={video.video_url} controls className="w-full h-full object-cover" />
                ) : (
                  <Video className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{video.video_id}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(video.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={`flex items-center gap-1 ${statusColors[video.status]}`}>
                    {statusIcons[video.status]}
                    {video.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {video.prompt}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{video.duration}s</span>
                  <span>•</span>
                  <span>{video.aspect_ratio}</span>
                  <span>•</span>
                  <span className="capitalize">{video.style}</span>
                </div>
              </div>
            </Card>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No videos yet. Generate your first AI video!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VideoGenerationPage;