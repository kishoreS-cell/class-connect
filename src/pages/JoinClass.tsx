import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users } from 'lucide-react';

export default function JoinClass() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [classCode, setClassCode] = useState('');
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

  if (profile?.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);

    try {
      // Find the class by code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('class_code', classCode.toUpperCase().trim())
        .single();

      if (classError || !classData) {
        toast({
          title: 'Class not found',
          description: 'Please check the class code and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', profile.id)
        .single();

      if (existingMember) {
        toast({
          title: 'Already joined',
          description: 'You are already a member of this class.',
        });
        navigate(`/class/${classData.id}`);
        return;
      }

      // Join the class
      const { error: joinError } = await supabase
        .from('class_members')
        .insert({
          class_id: classData.id,
          student_id: profile.id,
        });

      if (joinError) throw joinError;

      toast({
        title: 'Joined successfully!',
        description: `You are now a member of ${classData.name}`,
      });

      navigate(`/class/${classData.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join class',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Join a Class</h1>
              <p className="text-sm text-muted-foreground">Enter the code from your teacher</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Class Code</Label>
              <Input
                id="code"
                placeholder="e.g., ABC123"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="h-14 text-center text-2xl font-mono tracking-widest uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Ask your teacher for the 6-character class code
              </p>
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
                variant="sage"
                className="flex-1"
                disabled={isSubmitting || classCode.length !== 6}
              >
                {isSubmitting ? 'Joining...' : 'Join Class'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
