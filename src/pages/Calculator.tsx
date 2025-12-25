import { useState } from "react";
import { Helmet } from "react-helmet";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Delete, Divide, Equal, Minus, Plus, X } from "lucide-react";

const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue;
      let result = 0;

      switch (operation) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "*":
          result = currentValue * inputValue;
          break;
        case "/":
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result = 0;

    switch (operation) {
      case "+":
        result = previousValue + inputValue;
        break;
      case "-":
        result = previousValue - inputValue;
        break;
      case "*":
        result = previousValue * inputValue;
        break;
      case "/":
        result = inputValue !== 0 ? previousValue / inputValue : 0;
        break;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const buttonClass = "h-16 text-xl font-semibold transition-all hover:scale-105";
  const numberClass = `${buttonClass} bg-secondary hover:bg-secondary/80`;
  const operatorClass = `${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`;
  const functionClass = `${buttonClass} bg-muted hover:bg-muted/80`;

  return (
    <AppLayout>
      <Helmet>
        <title>Calculator | EduConnect</title>
        <meta name="description" content="Basic calculator for quick calculations" />
      </Helmet>

      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display */}
            <div className="bg-secondary/50 rounded-xl p-6 text-right">
              <div className="text-sm text-muted-foreground h-6">
                {previousValue !== null && operation && (
                  <span>{previousValue} {operation}</span>
                )}
              </div>
              <div className="text-4xl font-bold truncate">{display}</div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button className={functionClass} onClick={clear}>AC</Button>
              <Button className={functionClass} onClick={toggleSign}>±</Button>
              <Button className={functionClass} onClick={percentage}>%</Button>
              <Button className={operatorClass} onClick={() => performOperation("/")}>
                <Divide className="h-5 w-5" />
              </Button>

              <Button className={numberClass} onClick={() => inputDigit("7")}>7</Button>
              <Button className={numberClass} onClick={() => inputDigit("8")}>8</Button>
              <Button className={numberClass} onClick={() => inputDigit("9")}>9</Button>
              <Button className={operatorClass} onClick={() => performOperation("*")}>
                <X className="h-5 w-5" />
              </Button>

              <Button className={numberClass} onClick={() => inputDigit("4")}>4</Button>
              <Button className={numberClass} onClick={() => inputDigit("5")}>5</Button>
              <Button className={numberClass} onClick={() => inputDigit("6")}>6</Button>
              <Button className={operatorClass} onClick={() => performOperation("-")}>
                <Minus className="h-5 w-5" />
              </Button>

              <Button className={numberClass} onClick={() => inputDigit("1")}>1</Button>
              <Button className={numberClass} onClick={() => inputDigit("2")}>2</Button>
              <Button className={numberClass} onClick={() => inputDigit("3")}>3</Button>
              <Button className={operatorClass} onClick={() => performOperation("+")}>
                <Plus className="h-5 w-5" />
              </Button>

              <Button className={`${numberClass} col-span-2`} onClick={() => inputDigit("0")}>0</Button>
              <Button className={numberClass} onClick={inputDecimal}>.</Button>
              <Button className={operatorClass} onClick={calculate}>
                <Equal className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Calculator;
