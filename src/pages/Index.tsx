import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-2xl font-serif font-bold text-foreground">Studyroom</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Sign In</Link>
        </Button>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
            Teaching and learning,{' '}
            <span className="text-primary">simplified</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A simple, beautiful classroom app for teachers to share notes, create assignments, and connect with students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="warm" size="lg">
              <Link to="/auth">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              icon: GraduationCap,
              title: 'For Teachers',
              description: 'Create classes, share codes, upload notes and manage assignments with ease.',
              color: 'bg-primary/10 text-primary',
            },
            {
              icon: Users,
              title: 'For Students',
              description: 'Join classes with a simple code, access materials, and submit work on time.',
              color: 'bg-sage/20 text-sage',
            },
            {
              icon: BookOpen,
              title: 'Stay Organized',
              description: 'All your classes, notes, and assignments in one clean, simple place.',
              color: 'bg-mustard/20 text-mustard',
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
