import { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText, Users, Copy, CheckCircle, MessageCircle, UserMinus, ScrollText, Upload, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatDialog } from '@/components/ChatDialog';
import { VideoCallDialog } from '@/components/VideoCallDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  year: number;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  class_id: string;
  created_at: string;
  uploader?: { full_name: string };
}

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'assignments' | 'members' | 'papers'>('notes');
  const [members, setMembers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  
  // Question paper upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperSubject, setPaperSubject] = useState('');
  const [paperYear, setPaperYear] = useState(new Date().getFullYear().toString());
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const paperFileRef = useRef<HTMLInputElement>(null);
  
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

        // Fetch question papers
        const { data: papersData } = await supabase
          .from('question_papers')
          .select('*')
          .eq('class_id', id)
          .order('year', { ascending: false });

        // Fetch uploader names for question papers
        if (papersData && papersData.length > 0) {
          const uploaderIds = [...new Set(papersData.map(p => p.uploaded_by))];
          const { data: uploaders } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', uploaderIds);
          
          const uploaderMap = new Map(uploaders?.map(u => [u.id, u.full_name]) || []);
          const papersWithUploaders = papersData.map(paper => ({
            ...paper,
            uploader: { full_name: uploaderMap.get(paper.uploaded_by) || 'Unknown' }
          }));
          setQuestionPapers(papersWithUploaders);
        } else {
          setQuestionPapers([]);
        }

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

  const uploadQuestionPaper = async () => {
    const file = paperFileRef.current?.files?.[0];
    if (!file || !paperTitle || !paperSubject || !paperYear || !profile || !id) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setUploadingPaper(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/papers/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('class-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('class-files')
        .getPublicUrl(filePath);

      const { data: newPaper, error: insertError } = await supabase
        .from('question_papers')
        .insert({
          title: paperTitle,
          subject: paperSubject,
          year: parseInt(paperYear),
          file_url: publicUrl,
          file_name: file.name,
          uploaded_by: profile.id,
          class_id: id,
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      const paperWithUploader = {
        ...newPaper,
        uploader: { full_name: profile.full_name }
      };

      setQuestionPapers([paperWithUploader, ...questionPapers]);
      setUploadDialogOpen(false);
      setPaperTitle('');
      setPaperSubject('');
      setPaperYear(new Date().getFullYear().toString());
      if (paperFileRef.current) paperFileRef.current.value = '';

      toast({ title: 'Question paper uploaded successfully!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPaper(false);
    }
  };

  const deleteQuestionPaper = async (paper: QuestionPaper) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;

    try {
      const { error } = await supabase
        .from('question_papers')
        .delete()
        .eq('id', paper.id);

      if (error) throw error;

      setQuestionPapers(questionPapers.filter(p => p.id !== paper.id));
      toast({ title: 'Question paper deleted' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
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
    { id: 'papers', label: 'Question Papers', icon: ScrollText, count: questionPapers.length },
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

          {activeTab === 'papers' && (
            <div className="space-y-4">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Question Paper
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Question Paper</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paper-title">Title</Label>
                      <Input
                        id="paper-title"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        placeholder="e.g., Final Exam 2023"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paper-subject">Subject</Label>
                      <Input
                        id="paper-subject"
                        value={paperSubject}
                        onChange={(e) => setPaperSubject(e.target.value)}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paper-year">Year</Label>
                      <Input
                        id="paper-year"
                        type="number"
                        value={paperYear}
                        onChange={(e) => setPaperYear(e.target.value)}
                        placeholder="e.g., 2023"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paper-file">File</Label>
                      <Input
                        id="paper-file"
                        type="file"
                        ref={paperFileRef}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      />
                    </div>
                    <Button onClick={uploadQuestionPaper} disabled={uploadingPaper} className="w-full">
                      {uploadingPaper ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {questionPapers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No question papers yet</p>
                  <p className="text-sm">Upload previous year question papers</p>
                </div>
              ) : (
                questionPapers.map((paper) => (
                  <div key={paper.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground">{paper.subject} • {paper.year}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded by {paper.uploader?.full_name} • {paper.file_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(paper.file_url, '_blank')}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      {paper.uploaded_by === profile?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestionPaper(paper)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
