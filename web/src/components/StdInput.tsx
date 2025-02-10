"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Terminal, X } from "lucide-react";
const StdInput = () => {
  console.log("render");
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleInput = () => {
    setIsOpen(!isOpen);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleClear = () => {
    setInput("");
  };
  return (
    <div className="w-full">
      <div className=" flex items-center space-x-2">
        <Button
          variant={"outline"}
          onClick={toggleInput}
          className="flex-grow text-left justify-start font-mono"
        >
          <Terminal className=" mr-2 h-4 w-4 "></Terminal>
          stdin {input && `${input.split("\n").length} lines`}
        </Button>
        {input && (
          <Button
            variant={"ghost"}
            size={"icon"}
            className=" text-muted-foreground  justify-center hover:text-destructive"
            onClick={handleClear}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Clear input</span>
          </Button>
        )}
      </div>
      {isOpen && (
        <div className="w-full mt-2 p-4">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Enter your input here"
            className="font-mono min-h-[200px] w-full  "
          />
        </div>
      )}
    </div>
  );
};

export default StdInput;
