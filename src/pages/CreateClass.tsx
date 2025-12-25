import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function CreateClass() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  const generateClassCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);

    try {
      const classCode = generateClassCode();

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name,
          description: description || null,
          teacher_id: profile.id,
          class_code: classCode,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Class created!',
        description: `Your class code is: ${classCode}`,
      });

      navigate(`/class/${data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create class',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Create a Class</h1>
              <p className="text-sm text-muted-foreground">Set up a new learning space for your students</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics 101, English Literature"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe what this class is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A unique class code will be generated</li>
                <li>• Share this code with your students to join</li>
                <li>• You can upload notes and create assignments</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="warm"
                className="flex-1"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
