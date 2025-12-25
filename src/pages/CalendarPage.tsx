import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Bell,
  PartyPopper,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Holiday {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string | null;
  is_completed: boolean;
}

const CalendarPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Holiday form
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayDescription, setHolidayDescription] = useState("");
  const [holidayDate, setHolidayDate] = useState<Date | undefined>();

  // Reminder form
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState("");

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const [holidaysRes, remindersRes] = await Promise.all([
      supabase.from("holidays").select("*").eq("user_id", profile.id),
      supabase.from("reminders").select("*").eq("user_id", profile.id).order("reminder_date"),
    ]);

    if (holidaysRes.data) setHolidays(holidaysRes.data);
    if (remindersRes.data) setReminders(remindersRes.data);
    setLoading(false);
  };

  const addHoliday = async () => {
    if (!profile?.id || !holidayTitle || !holidayDate) return;

    const { error } = await supabase.from("holidays").insert({
      user_id: profile.id,
      title: holidayTitle,
      description: holidayDescription || null,
      date: format(holidayDate, "yyyy-MM-dd"),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Holiday added!" });
      setHolidayDialogOpen(false);
      setHolidayTitle("");
      setHolidayDescription("");
      setHolidayDate(undefined);
      fetchData();
    }
  };

  const deleteHoliday = async (id: string) => {
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (!error) {
      setHolidays(holidays.filter((h) => h.id !== id));
      toast({ title: "Holiday removed" });
    }
  };

  const addReminder = async () => {
    if (!profile?.id || !reminderTitle || !reminderDate) return;

    const { error } = await supabase.from("reminders").insert({
      user_id: profile.id,
      title: reminderTitle,
      description: reminderDescription || null,
      reminder_date: format(reminderDate, "yyyy-MM-dd"),
      reminder_time: reminderTime || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reminder added!" });
      setReminderDialogOpen(false);
      setReminderTitle("");
      setReminderDescription("");
      setReminderDate(undefined);
      setReminderTime("");
      fetchData();
    }
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("reminders")
      .update({ is_completed: !completed })
      .eq("id", id);

    if (!error) {
      setReminders(
        reminders.map((r) => (r.id === id ? { ...r, is_completed: !completed } : r))
      );
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (!error) {
      setReminders(reminders.filter((r) => r.id !== id));
      toast({ title: "Reminder removed" });
    }
  };

  const getHolidaysForDate = (date: Date) => {
    return holidays.filter((h) => isSameDay(parseISO(h.date), date));
  };

  const getRemindersForDate = (date: Date) => {
    return reminders.filter((r) => isSameDay(parseISO(r.reminder_date), date));
  };

  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];
  const selectedDateReminders = selectedDate ? getRemindersForDate(selectedDate) : [];

  const upcomingReminders = reminders
    .filter((r) => !r.is_completed && parseISO(r.reminder_date) >= new Date())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Track holidays and set reminders</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PartyPopper className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={holidayTitle}
                      onChange={(e) => setHolidayTitle(e.target.value)}
                      placeholder="e.g., Christmas Break"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={holidayDescription}
                      onChange={(e) => setHolidayDescription(e.target.value)}
                      placeholder="Add details..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !holidayDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {holidayDate ? format(holidayDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={holidayDate}
                          onSelect={setHolidayDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={addHoliday} className="w-full">
                    Add Holiday
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Bell className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Reminder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      placeholder="e.g., Submit assignment"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={reminderDescription}
                      onChange={(e) => setReminderDescription(e.target.value)}
                      placeholder="Add details..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !reminderDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={reminderDate}
                          onSelect={setReminderDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Time (optional)</Label>
                    <Input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                  </div>
                  <Button onClick={addReminder} className="w-full">
                    Add Reminder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                modifiers={{
                  holiday: holidays.map((h) => parseISO(h.date)),
                  reminder: reminders.map((r) => parseISO(r.reminder_date)),
                }}
                modifiersStyles={{
                  holiday: { backgroundColor: "hsl(var(--destructive) / 0.2)", borderRadius: "4px" },
                  reminder: { border: "2px solid hsl(var(--primary))", borderRadius: "4px" },
                }}
              />
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDateHolidays.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Holidays</h4>
                    {selectedDateHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex items-start justify-between p-2 bg-destructive/10 rounded-lg mb-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <PartyPopper className="w-4 h-4 text-destructive" />
                            <span className="font-medium">{holiday.title}</span>
                          </div>
                          {holiday.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {holiday.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteHoliday(holiday.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDateReminders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Reminders</h4>
                    {selectedDateReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={cn(
                          "flex items-start justify-between p-2 rounded-lg mb-2",
                          reminder.is_completed ? "bg-muted" : "bg-primary/10"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mt-0.5"
                            onClick={() => toggleReminder(reminder.id, reminder.is_completed)}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2",
                                reminder.is_completed
                                  ? "bg-primary border-primary"
                                  : "border-primary"
                              )}
                            >
                              {reminder.is_completed && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          </Button>
                          <div>
                            <span
                              className={cn(
                                "font-medium",
                                reminder.is_completed && "line-through text-muted-foreground"
                              )}
                            >
                              {reminder.title}
                            </span>
                            {reminder.reminder_time && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {reminder.reminder_time}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDateHolidays.length === 0 && selectedDateReminders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events for this date
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Reminders */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingReminders.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{reminder.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(reminder.reminder_date), "MMM d")}
                            {reminder.reminder_time && ` at ${reminder.reminder_time}`}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {format(parseISO(reminder.reminder_date), "EEE")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming reminders
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
