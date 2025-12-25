import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Calculator, GraduationCap, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

interface Semester {
  id: string;
  name: string;
  courses: Course[];
  gpa: number;
  totalCredits: number;
}

const gradePoints: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
};

const GpaCalculator = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [semesters, setSemesters] = useState<Semester[]>([
    {
      id: '1',
      name: 'Semester 1',
      courses: [{ id: '1', name: '', credits: 3, grade: 'O' }],
      gpa: 0,
      totalCredits: 0,
    },
  ]);

  const addCourse = (semesterId: string) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semesterId) {
        return {
          ...sem,
          courses: [...sem.courses, { 
            id: Date.now().toString(), 
            name: '', 
            credits: 3, 
            grade: 'O' 
          }],
        };
      }
      return sem;
    }));
  };

  const removeCourse = (semesterId: string, courseId: string) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semesterId) {
        return {
          ...sem,
          courses: sem.courses.filter(c => c.id !== courseId),
        };
      }
      return sem;
    }));
  };

  const updateCourse = (semesterId: string, courseId: string, field: keyof Course, value: string | number) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semesterId) {
        return {
          ...sem,
          courses: sem.courses.map(c => 
            c.id === courseId ? { ...c, [field]: value } : c
          ),
        };
      }
      return sem;
    }));
  };

  const addSemester = () => {
    setSemesters([
      ...semesters,
      {
        id: Date.now().toString(),
        name: `Semester ${semesters.length + 1}`,
        courses: [{ id: Date.now().toString(), name: '', credits: 3, grade: 'O' }],
        gpa: 0,
        totalCredits: 0,
      },
    ]);
  };

  const removeSemester = (semesterId: string) => {
    if (semesters.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'You need at least one semester',
        variant: 'destructive',
      });
      return;
    }
    setSemesters(semesters.filter(s => s.id !== semesterId));
  };

  const calculateGPA = (courses: Course[]): { gpa: number; totalCredits: number } => {
    if (courses.length === 0) return { gpa: 0, totalCredits: 0 };

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const points = gradePoints[course.grade] || 0;
      totalPoints += points * course.credits;
      totalCredits += course.credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return { gpa: Math.round(gpa * 100) / 100, totalCredits };
  };

  const calculateAll = () => {
    const updatedSemesters = semesters.map(sem => {
      const { gpa, totalCredits } = calculateGPA(sem.courses);
      return { ...sem, gpa, totalCredits };
    });
    setSemesters(updatedSemesters);

    toast({
      title: '✅ Calculated!',
      description: 'GPA and CGPA have been calculated',
    });
  };

  const calculateCGPA = (): { cgpa: number; totalCredits: number } => {
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(sem => {
      sem.courses.forEach(course => {
        const points = gradePoints[course.grade] || 0;
        totalPoints += points * course.credits;
        totalCredits += course.credits;
      });
    });

    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return { cgpa: Math.round(cgpa * 100) / 100, totalCredits };
  };

  const { cgpa, totalCredits: overallCredits } = calculateCGPA();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              GPA & CGPA Calculator
            </h1>
            <p className="text-muted-foreground">Calculate your semester GPA and cumulative CGPA</p>
          </div>
        </div>

        {/* CGPA Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/20 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cumulative GPA (CGPA)</p>
                  <p className="text-4xl font-bold text-primary">{cgpa.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-semibold">{overallCredits}</p>
              </div>
              <Button onClick={calculateAll} size="lg" className="gap-2">
                <Calculator className="h-5 w-5" />
                Calculate All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Semesters */}
        <div className="space-y-6">
          {semesters.map((semester, semIndex) => (
            <Card key={semester.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Input
                      value={semester.name}
                      onChange={(e) => {
                        setSemesters(semesters.map(s => 
                          s.id === semester.id ? { ...s, name: e.target.value } : s
                        ));
                      }}
                      className="font-semibold text-lg w-40"
                    />
                    {semester.gpa > 0 && (
                      <div className="px-3 py-1 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium">GPA: {semester.gpa.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSemester(semester.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-1">
                    <div className="col-span-5">Course Name</div>
                    <div className="col-span-3">Credits</div>
                    <div className="col-span-3">Grade</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Courses */}
                  {semester.courses.map((course) => (
                    <div key={course.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Course name"
                          value={course.name}
                          onChange={(e) => updateCourse(semester.id, course.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="1"
                          max="6"
                          value={course.credits}
                          onChange={(e) => updateCourse(semester.id, course.id, 'credits', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={course.grade}
                          onValueChange={(value) => updateCourse(semester.id, course.id, 'grade', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(gradePoints).map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade} ({gradePoints[grade].toFixed(1)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCourse(semester.id, course.id)}
                          disabled={semester.courses.length === 1}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCourse(semester.id)}
                    className="mt-2 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={addSemester}
          variant="outline"
          className="w-full mt-6 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Semester
        </Button>

        {/* Grade Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Grade Point Reference</CardTitle>
            <CardDescription>10-point grading scale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {Object.entries(gradePoints).map(([grade, points]) => (
                <div key={grade} className="text-center p-3 bg-muted rounded-md">
                  <div className="font-semibold text-lg">{grade}</div>
                  <div className="text-sm text-muted-foreground">{points} points</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default GpaCalculator;