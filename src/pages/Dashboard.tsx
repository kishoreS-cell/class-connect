import { useEffect, useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Users, 
  Calendar,
  Plus,
  Copy,
  Check,
  Bell,
  Clock,
  PartyPopper,
  ChevronRight,
  StickyNote,
  Pencil,
  Trash2,
  X,
  Save,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from 'date-fns';

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

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string | null;
  is_completed: boolean;
}

interface Holiday {
  id: string;
  title: string;
  date: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link: string | null;
}

interface StudentNote {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  class_name?: string;
  student_name?: string;
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchClasses();
      fetchRemindersAndHolidays();
      fetchNotifications();
      fetchAttendance();
      if (profile.role === 'student') {
        fetchStudentNotes();
      }
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

  const fetchRemindersAndHolidays = async () => {
    if (!profile?.id) return;

    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Fetch upcoming reminders (next 7 days, not completed)
    const { data: remindersData } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_completed', false)
      .gte('reminder_date', format(today, 'yyyy-MM-dd'))
      .lte('reminder_date', format(nextWeek, 'yyyy-MM-dd'))
      .order('reminder_date');

    if (remindersData) setReminders(remindersData);

    // Fetch upcoming holidays (next 7 days)
    const { data: holidaysData } = await supabase
      .from('holidays')
      .select('*')
      .eq('user_id', profile.id)
      .gte('date', format(today, 'yyyy-MM-dd'))
      .lte('date', format(nextWeek, 'yyyy-MM-dd'))
      .order('date');

    if (holidaysData) setHolidays(holidaysData);
  };

  const fetchNotifications = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setNotifications(data);
  };

  const fetchAttendance = async () => {
    if (!profile?.id) return;

    const today = new Date();
    const lastWeek = addDays(today, -7);

    if (profile.role === 'teacher') {
      // Get classes taught by this teacher
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', profile.id);

      if (teacherClasses && teacherClasses.length > 0) {
        const classIds = teacherClasses.map(c => c.id);
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .in('class_id', classIds)
          .gte('date', format(lastWeek, 'yyyy-MM-dd'))
          .order('date', { ascending: false })
          .limit(10);

        if (attendance && attendance.length > 0) {
          // Get student names
          const studentIds = [...new Set(attendance.map(a => a.student_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds);

          const records = attendance.map((a: any) => ({
            ...a,
            class_name: teacherClasses.find(c => c.id === a.class_id)?.name,
            student_name: profiles?.find(p => p.id === a.student_id)?.full_name
          }));
          setAttendanceRecords(records);
        }
      }
    } else {
      // Student - get their attendance
      const { data: memberClasses } = await supabase
        .from('class_members')
        .select('class_id, classes(name)')
        .eq('student_id', profile.id);

      if (memberClasses && memberClasses.length > 0) {
        const classIds = memberClasses.map((m: any) => m.class_id);
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', profile.id)
          .in('class_id', classIds)
          .gte('date', format(lastWeek, 'yyyy-MM-dd'))
          .order('date', { ascending: false })
          .limit(10);

        if (attendance) {
          const records = attendance.map((a: any) => ({
            ...a,
            class_name: (memberClasses.find((m: any) => m.class_id === a.class_id) as any)?.classes?.name
          }));
          setAttendanceRecords(records);
        }
      }
    }
  };

  const fetchStudentNotes = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('student_notes')
      .select('*')
      .eq('student_id', profile.id)
      .order('updated_at', { ascending: false });

    if (data) setStudentNotes(data);
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const saveNote = async () => {
    if (!profile?.id || !noteTitle.trim()) return;

    setSavingNote(true);
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('student_notes')
          .update({ title: noteTitle.trim(), content: noteContent.trim() || null })
          .eq('id', editingNote.id);

        if (error) throw error;

        setStudentNotes(studentNotes.map(n => 
          n.id === editingNote.id 
            ? { ...n, title: noteTitle.trim(), content: noteContent.trim() || null, updated_at: new Date().toISOString() }
            : n
        ));
        toast({ title: 'Note updated' });
      } else {
        const { data, error } = await supabase
          .from('student_notes')
          .insert({ student_id: profile.id, title: noteTitle.trim(), content: noteContent.trim() || null })
          .select()
          .single();

        if (error) throw error;

        setStudentNotes([data, ...studentNotes]);
        toast({ title: 'Note created' });
      }

      resetNoteForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('student_notes').delete().eq('id', id);
      if (error) throw error;

      setStudentNotes(studentNotes.filter(n => n.id !== id));
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const startEditNote = (note: StudentNote) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content || '');
    setShowNoteForm(true);
  };

  const resetNoteForm = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
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

        {/* Notifications & Reminders Section */}
        {(notifications.length > 0 || reminders.length > 0 || holidays.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Notifications Card */}
            {notifications.length > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                    <Badge variant="secondary" className="ml-auto">{notifications.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start justify-between p-3 bg-background rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notif.link && (
                          <Link to={notif.link}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Reminders & Holidays Card */}
            {(reminders.length > 0 || holidays.length > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Upcoming This Week
                    <Link to="/calendar" className="ml-auto">
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        View Calendar
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Holidays */}
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg"
                    >
                      <PartyPopper className="w-4 h-4 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{holiday.title}</p>
                        <p className="text-xs text-muted-foreground">Holiday</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getDateLabel(holiday.date)}
                      </Badge>
                    </div>
                  ))}

                  {/* Reminders */}
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <Bell className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reminder.title}</p>
                        {reminder.reminder_time && (
                          <p className="text-xs text-muted-foreground">
                            at {reminder.reminder_time}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={isTomorrow(parseISO(reminder.reminder_date)) ? "default" : "outline"} 
                        className="text-xs"
                      >
                        {getDateLabel(reminder.reminder_date)}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Student Notes Section */}
            {profile?.role === 'student' && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-primary" />
                    My Notes
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto gap-1"
                      onClick={() => setShowNoteForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showNoteForm && (
                    <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                      <Input
                        placeholder="Note title"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Write your note here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={resetNoteForm}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveNote}
                          disabled={savingNote || !noteTitle.trim()}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {savingNote ? 'Saving...' : editingNote ? 'Update' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {studentNotes.length === 0 && !showNoteForm ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Click "Add Note" to create your first note.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {studentNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-1">{note.title}</h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startEditNote(note)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteNote(note.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {note.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {note.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(parseISO(note.updated_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Attendance Section */}
        {attendanceRecords.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {profile?.role === 'teacher' ? 'Recent Attendance' : 'My Attendance'}
                <Badge variant="secondary" className="ml-auto">Last 7 days</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' :
                        record.status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">
                          {profile?.role === 'teacher' ? record.student_name : record.class_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.role === 'teacher' ? record.class_name : getDateLabel(record.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.role === 'teacher' && (
                        <span className="text-xs text-muted-foreground">
                          {getDateLabel(record.date)}
                        </span>
                      )}
                      <Badge 
                        variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
