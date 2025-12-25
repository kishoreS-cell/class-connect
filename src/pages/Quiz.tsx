import { useState, useEffect, useCallback, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, Brain, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const allQuestions: Question[] = [
  // Geography
  { id: 1, question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: 2, category: "Geography" },
  { id: 2, question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, category: "Geography" },
  { id: 3, question: "Which country has the most population?", options: ["USA", "India", "China", "Russia"], correctAnswer: 2, category: "Geography" },
  { id: 4, question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correctAnswer: 2, category: "Geography" },
  { id: 5, question: "Which continent is the Sahara Desert located in?", options: ["Asia", "Africa", "Australia", "South America"], correctAnswer: 1, category: "Geography" },
  
  // Math
  { id: 6, question: "What is 15 × 12?", options: ["170", "180", "190", "200"], correctAnswer: 1, category: "Math" },
  { id: 7, question: "What is 256 ÷ 16?", options: ["14", "15", "16", "17"], correctAnswer: 2, category: "Math" },
  { id: 8, question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctAnswer: 2, category: "Math" },
  { id: 9, question: "What is 7 × 8?", options: ["54", "56", "58", "64"], correctAnswer: 1, category: "Math" },
  { id: 10, question: "What is 1000 - 567?", options: ["433", "443", "453", "463"], correctAnswer: 0, category: "Math" },
  
  // Science
  { id: 11, question: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correctAnswer: 2, category: "Science" },
  { id: 12, question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1, category: "Science" },
  { id: 13, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"], correctAnswer: 2, category: "Science" },
  { id: 14, question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: 2, category: "Science" },
  { id: 15, question: "How many bones are in the adult human body?", options: ["186", "196", "206", "216"], correctAnswer: 2, category: "Science" },
  
  // Literature
  { id: 16, question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctAnswer: 1, category: "Literature" },
  { id: 17, question: "Who wrote 'Pride and Prejudice'?", options: ["Emily Brontë", "Jane Austen", "Charlotte Brontë", "Virginia Woolf"], correctAnswer: 1, category: "Literature" },
  { id: 18, question: "Who is the author of 'Harry Potter'?", options: ["J.R.R. Tolkien", "C.S. Lewis", "J.K. Rowling", "Stephen King"], correctAnswer: 2, category: "Literature" },
  
  // History
  { id: 19, question: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctAnswer: 2, category: "History" },
  { id: 20, question: "Who was the first President of the United States?", options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"], correctAnswer: 2, category: "History" },
  { id: 21, question: "In which year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correctAnswer: 1, category: "History" },
  
  // Art
  { id: 22, question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"], correctAnswer: 2, category: "Art" },
  { id: 23, question: "Who painted 'Starry Night'?", options: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"], correctAnswer: 1, category: "Art" },
  { id: 24, question: "Who sculpted 'David'?", options: ["Donatello", "Leonardo", "Michelangelo", "Raphael"], correctAnswer: 2, category: "Art" },
  
  // General Knowledge
  { id: 25, question: "How many continents are there?", options: ["5", "6", "7", "8"], correctAnswer: 2, category: "General" },
  { id: 26, question: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], correctAnswer: 1, category: "General" },
  { id: 27, question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correctAnswer: 2, category: "General" },
  { id: 28, question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctAnswer: 2, category: "General" },
  { id: 29, question: "How many days are in a leap year?", options: ["364", "365", "366", "367"], correctAnswer: 2, category: "General" },
  { id: 30, question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correctAnswer: 2, category: "Math" },
];

const TIMER_DURATION = 30;
const QUESTIONS_PER_QUIZ = 10;

const Quiz = () => {
  const [gameState, setGameState] = useState<"start" | "playing" | "result">("start");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; correct: boolean }[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = () => {
    // Shuffle all questions and pick first N
    const shuffled = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_QUIZ);
    setShuffledQuestions(shuffled);
    setGameState("playing");
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(TIMER_DURATION);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult || shuffledQuestions.length === 0) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, correct: isCorrect }]);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(TIMER_DURATION);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameState("result");
    }
  }, [currentQuestionIndex, shuffledQuestions.length]);

  const handleTimeOut = useCallback(() => {
    if (showResult || shuffledQuestions.length === 0) return;
    
    setShowResult(true);
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, correct: false }]);
    
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  }, [showResult, shuffledQuestions, currentQuestionIndex, moveToNextQuestion]);

  useEffect(() => {
    if (gameState !== "playing" || showResult || shuffledQuestions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, showResult, shuffledQuestions.length, handleTimeOut]);

  const getTimerColor = () => {
    if (timeLeft > 20) return "bg-green-500";
    if (timeLeft > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreMessage = () => {
    if (shuffledQuestions.length === 0) return "Quiz Complete!";
    const percentage = (score / shuffledQuestions.length) * 100;
    if (percentage === 100) return "Perfect Score! 🎉";
    if (percentage >= 80) return "Excellent Work! 🌟";
    if (percentage >= 60) return "Good Job! 👍";
    if (percentage >= 40) return "Keep Practicing! 💪";
    return "Don't Give Up! 📚";
  };

  if (gameState === "start") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Quiz Challenge</CardTitle>
                <p className="text-muted-foreground text-lg">
                  Test your knowledge with {QUESTIONS_PER_QUIZ} random questions!
                </p>
              </div>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{TIMER_DURATION} seconds</p>
                  <p className="text-sm text-muted-foreground">per question</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{QUESTIONS_PER_QUIZ} questions</p>
                  <p className="text-sm text-muted-foreground">from {allQuestions.length} total</p>
                </div>
              </div>
              
              <Button 
                onClick={startQuiz} 
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (gameState === "result") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">{getScoreMessage()}</CardTitle>
              </div>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-6xl font-bold text-primary">{score}/{shuffledQuestions.length}</p>
                <p className="text-muted-foreground mt-2">Questions Correct</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Summary</h3>
                <div className="grid grid-cols-5 gap-2">
                  {answers.map((answer, index) => (
                    <div
                      key={index}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center",
                        answer.correct ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}
                    >
                      {answer.correct ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={startQuiz} 
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Playing state - ensure we have questions before rendering
  if (shuffledQuestions.length === 0 || !shuffledQuestions[currentQuestionIndex]) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p>Loading questions...</p>
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress and Timer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / shuffledQuestions.length) * 100} />
          </div>
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl transition-colors",
            getTimerColor()
          )}>
            {timeLeft}
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">{currentQuestion.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-2xl font-semibold">{currentQuestion.question}</h2>
            
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                
                let buttonStyle = "border-2 border-border hover:border-primary hover:bg-primary/5";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonStyle = "border-2 border-green-500 bg-green-50 text-green-700";
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = "border-2 border-red-500 bg-red-50 text-red-700";
                  } else {
                    buttonStyle = "border-2 border-border opacity-50";
                  }
                } else if (isSelected) {
                  buttonStyle = "border-2 border-primary bg-primary/10";
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      "h-14 text-left justify-start text-lg font-medium transition-all",
                      buttonStyle
                    )}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                  >
                    <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3 text-sm">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {showResult && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 ml-auto text-red-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Quiz;
