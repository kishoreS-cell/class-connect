import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-sage/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-mustard/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero */}
      <header className="container relative z-10 mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 animate-tilt-in" style={{ perspective: '1000px' }}>
          <div className="animate-bounce-3d">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <span className="text-2xl font-serif font-bold text-foreground">Studyroom</span>
        </div>
        <Button asChild variant="outline" size="sm" className="animate-flip-in hover:scale-105 transition-transform">
          <Link to="/auth">Sign In</Link>
        </Button>
      </header>

      <main className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center" style={{ perspective: '1200px' }}>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight animate-tilt-in">
            Teaching and learning,{' '}
            <span className="text-primary inline-block animate-float-slow">simplified</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-scale-3d" style={{ animationDelay: '0.2s' }}>
            A simple, beautiful classroom app for teachers to share notes, create assignments, and connect with students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-3d" style={{ animationDelay: '0.4s' }}>
            <Button asChild variant="warm" size="lg" className="group hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <Link to="/auth" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24" style={{ perspective: '1000px' }}>
          {[
            {
              icon: GraduationCap,
              title: 'For Teachers',
              description: 'Create classes, share codes, upload notes and manage assignments with ease.',
              color: 'bg-primary/10 text-primary',
              delay: '0.1s',
            },
            {
              icon: Users,
              title: 'For Students',
              description: 'Join classes with a simple code, access materials, and submit work on time.',
              color: 'bg-sage/20 text-sage',
              delay: '0.3s',
            },
            {
              icon: BookOpen,
              title: 'Stay Organized',
              description: 'All your classes, notes, and assignments in one clean, simple place.',
              color: 'bg-mustard/20 text-mustard',
              delay: '0.5s',
            },
          ].map((feature) => (
            <div 
              key={feature.title} 
              className="text-center p-6 rounded-2xl bg-card border border-border animate-flip-in group cursor-pointer"
              style={{ 
                animationDelay: feature.delay,
                transformStyle: 'preserve-3d',
              }}
            >
              <div 
                className="transition-all duration-500 group-hover:[transform:perspective(1000px)_rotateY(10deg)_rotateX(-5deg)_translateZ(20px)] group-hover:shadow-2xl rounded-2xl p-6 -m-6"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:animate-bounce-3d`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
