import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
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

const questions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    id: 2,
    question: "What is 15 × 12?",
    options: ["170", "180", "190", "200"],
    correctAnswer: 1,
    category: "Math"
  },
  {
    id: 3,
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    id: 4,
    question: "What is the chemical symbol for Gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    id: 5,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    id: 6,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    id: 7,
    question: "What is 256 ÷ 16?",
    options: ["14", "15", "16", "17"],
    correctAnswer: 2,
    category: "Math"
  },
  {
    id: 8,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art"
  },
  {
    id: 9,
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    id: 10,
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History"
  }
];

const TIMER_DURATION = 30;

const Quiz = () => {
  const [gameState, setGameState] = useState<"start" | "playing" | "result">("start");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; correct: boolean }[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const shuffleQuestions = useCallback(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, []);

  const startQuiz = () => {
    shuffleQuestions();
    setGameState("playing");
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(TIMER_DURATION);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, correct: isCorrect }]);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(TIMER_DURATION);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameState("result");
    }
  };

  const timeOut = useCallback(() => {
    if (!showResult) {
      setShowResult(true);
      const currentQuestion = shuffledQuestions[currentQuestionIndex];
      setAnswers(prev => [...prev, { questionId: currentQuestion.id, correct: false }]);
      
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  }, [showResult, shuffledQuestions, currentQuestionIndex]);

  useEffect(() => {
    if (gameState !== "playing" || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          timeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, showResult, timeOut]);

  const getTimerColor = () => {
    if (timeLeft > 20) return "bg-green-500";
    if (timeLeft > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreMessage = () => {
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
        <Helmet>
          <title>Quiz Challenge | EduConnect</title>
          <meta name="description" content="Test your knowledge with timed quiz questions" />
        </Helmet>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Quiz Challenge</CardTitle>
                <p className="text-muted-foreground text-lg">
                  Test your knowledge with {questions.length} questions!
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
                  <p className="font-semibold">{questions.length} questions</p>
                  <p className="text-sm text-muted-foreground">to answer</p>
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
        <Helmet>
          <title>Quiz Results | EduConnect</title>
        </Helmet>

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

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  return (
    <AppLayout>
      <Helmet>
        <title>Quiz - Question {currentQuestionIndex + 1} | EduConnect</title>
      </Helmet>

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
              <Badge variant="secondary">{currentQuestion.category}</Badge>
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
