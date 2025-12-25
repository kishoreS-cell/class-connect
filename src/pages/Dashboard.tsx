import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Calendar,
  FileText,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  class_code: string;
  cover_color: string;
  teacher_id: string;
  created_at: string;
  teacher?: {
    full_name: string;
  };
  member_count?: number;
  assignment_count?: number;
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchClasses();
    }
  }, [profile]);

  const fetchClasses = async () => {
    if (!profile) return;

    try {
      let query;
      
      if (profile.role === 'teacher') {
        query = supabase
          .from('classes')
          .select(`
            *,
            teacher:profiles!classes_teacher_id_fkey(full_name)
          `)
          .eq('teacher_id', profile.id)
          .order('created_at', { ascending: false });
      } else {
        query = supabase
          .from('class_members')
          .select(`
            class:classes(
              *,
              teacher:profiles!classes_teacher_id_fkey(full_name)
            )
          `)
          .eq('student_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (profile.role === 'teacher') {
        setClasses(data || []);
      } else {
        setClasses((data || []).map((item: any) => item.class).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Copied!',
      description: 'Class code copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

  const colorPalette = [
    'bg-gradient-to-br from-terracotta to-coral',
    'bg-gradient-to-br from-sage to-sage-light',
    'bg-gradient-to-br from-mustard to-accent',
    'bg-gradient-to-br from-navy to-secondary',
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'teacher' 
              ? 'Manage your classes and assignments'
              : 'View your classes and upcoming work'}
          </p>
        </div>

        {loadingClasses ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
              {profile?.role === 'teacher' ? 'No classes yet' : 'No classes joined'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {profile?.role === 'teacher'
                ? 'Create your first class to start teaching and sharing materials with students.'
                : 'Join a class using a code from your teacher to get started.'}
            </p>
            <Button
              asChild
              variant="warm"
              size="lg"
            >
              <Link to={profile?.role === 'teacher' ? '/class/new' : '/join-class'}>
                <Plus className="h-5 w-5" />
                {profile?.role === 'teacher' ? 'Create Class' : 'Join Class'}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" style={{ perspective: '1200px' }}>
            {classes.map((cls, index) => (
              <Link
                key={cls.id}
                to={`/class/${cls.id}`}
                className="group block animate-flip-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className="rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-500 group-hover:[transform:perspective(1000px)_rotateY(5deg)_rotateX(-3deg)_translateZ(10px)] group-hover:shadow-2xl"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Color header */}
                  <div className={`h-24 ${colorPalette[index % colorPalette.length]} p-4 relative`}>
                    <h3 className="text-lg font-serif font-bold text-primary-foreground line-clamp-2 group-hover:translate-x-1 transition-transform">
                      {cls.name}
                    </h3>
                    {profile?.role === 'teacher' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyClassCode(cls.class_code);
                        }}
                        className="absolute top-3 right-3 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-primary-foreground transition-all hover:scale-110"
                      >
                        {copiedCode === cls.class_code ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {cls.class_code}
                      </button>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {cls.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {cls.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {profile?.role === 'student' && cls.teacher && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {cls.teacher.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cls.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Add new class card */}
            <Link
              to={profile?.role === 'teacher' ? '/class/new' : '/join-class'}
              className="group flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-500 bg-muted/30 hover:bg-muted/50 animate-scale-3d hover:[transform:perspective(1000px)_translateZ(20px)]"
              style={{ animationDelay: `${classes.length * 0.1}s`, transformStyle: 'preserve-3d' }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:animate-bounce-3d transition-transform">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {profile?.role === 'teacher' ? 'Create Class' : 'Join Class'}
              </span>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
