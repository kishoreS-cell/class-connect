import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText, Users, Copy, CheckCircle, MessageCircle, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatDialog } from '@/components/ChatDialog';
import { VideoCallDialog } from '@/components/VideoCallDialog';

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  class_code: string;
  cover_color: string | null;
  teacher_id: string;
  created_at: string;
  teacher?: {
    full_name: string;
  };
}

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'assignments' | 'members'>('notes');
  const [members, setMembers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Chat and call state
  const [chatOpen, setChatOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');

  useEffect(() => {
    if (!id || !profile) return;

    const fetchClassData = async () => {
      try {
        // Fetch class details
        const { data: classResult, error: classError } = await supabase
          .from('classes')
          .select('*, teacher:profiles!classes_teacher_id_fkey(full_name)')
          .eq('id', id)
          .maybeSingle();

        if (classError) throw classError;
        if (!classResult) {
          navigate('/dashboard');
          return;
        }

        setClassData(classResult);

        // Fetch members
        const { data: membersData } = await supabase
          .from('class_members')
          .select('*, student:profiles!class_members_student_id_fkey(full_name, avatar_url)')
          .eq('class_id', id);

        setMembers(membersData || []);

        // Fetch notes
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('class_id', id)
          .order('created_at', { ascending: false });

        setNotes(notesData || []);

        // Fetch assignments
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .eq('class_id', id)
          .order('due_date', { ascending: true });

        setAssignments(assignmentsData || []);

      } catch (error: any) {
        console.error('Error fetching class:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [id, profile, navigate, toast]);

  const copyClassCode = async () => {
    if (classData?.class_code) {
      await navigator.clipboard.writeText(classData.class_code);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Class code copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openChat = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
    setChatOpen(true);
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setChatOpen(false);
    setCallOpen(true);
  };

  const removeStudent = async (memberId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      toast({
        title: 'Student removed',
        description: `${studentName} has been removed from the class`,
      });
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!classData) {
    return <Navigate to="/dashboard" replace />;
  }

  const isTeacher = profile?.id === classData.teacher_id;

  const tabs = [
    { id: 'notes', label: 'Notes', icon: FileText, count: notes.length },
    { id: 'assignments', label: 'Assignments', icon: BookOpen, count: assignments.length },
    { id: 'members', label: 'Members', icon: Users, count: members.length },
  ] as const;

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Class Header */}
        <div 
          className="rounded-2xl p-8 mb-8 text-white animate-scale-3d"
          style={{ backgroundColor: classData.cover_color || '#E07A5F' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">{classData.name}</h1>
              {classData.description && (
                <p className="text-white/80">{classData.description}</p>
              )}
              <p className="text-white/70 text-sm mt-2">
                Teacher: {classData.teacher?.full_name}
              </p>
            </div>
            
            {isTeacher && (
              <div className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-white/70">Class Code</p>
                  <p className="text-xl font-mono font-bold tracking-wider">{classData.class_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyClassCode}
                  className="text-white hover:bg-white/20"
                >
                  {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notes yet</p>
                  {isTeacher && <p className="text-sm">Upload notes for your students</p>}
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground">{note.title}</h3>
                    {note.description && <p className="text-sm text-muted-foreground mt-1">{note.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{note.file_name}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments yet</p>
                  {isTeacher && <p className="text-sm">Create assignments for your students</p>}
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Due</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              {/* Teacher - shown for students */}
              {!isTeacher && (
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {classData.teacher?.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{classData.teacher?.full_name}</p>
                      <p className="text-xs text-primary">Teacher</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openChat(classData.teacher_id, classData.teacher?.full_name || 'Teacher')}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Button>
                </div>
              )}

              {/* For teacher, show their own card without chat button */}
              {isTeacher && (
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {classData.teacher?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{classData.teacher?.full_name}</p>
                    <p className="text-xs text-primary">Teacher (You)</p>
                  </div>
                </div>
              )}
              
              {/* Students */}
              {members.map((member) => (
                <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center">
                      <span className="text-secondary-foreground font-semibold">
                        {member.student?.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.student?.full_name}</p>
                      <p className="text-xs text-muted-foreground">Student</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.student_id !== profile?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openChat(member.student_id, member.student?.full_name || 'Student')}
                        className="gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    )}
                    {isTeacher && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudent(member.id, member.student?.full_name || 'Student')}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                      >
                        <UserMinus className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Dialog */}
        {selectedMember && classData && (
          <ChatDialog
            open={chatOpen}
            onOpenChange={setChatOpen}
            recipientId={selectedMember.id}
            recipientName={selectedMember.name}
            classId={classData.id}
            onStartCall={startCall}
          />
        )}

        {/* Video Call Dialog */}
        {selectedMember && (
          <VideoCallDialog
            open={callOpen}
            onOpenChange={setCallOpen}
            recipientName={selectedMember.name}
            callType={callType}
          />
        )}
      </div>
    </AppLayout>
  );
}
